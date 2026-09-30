"""
Link every PUSHCART* login to a real PUSH CART vehicle so the API reports an
authoritative vehicle type.

Why this is needed
------------------
swms_vehicles already holds one PUSH CART per zone, but almost no accounts are
linked to one. build_assignment() only sets vehicleType and isPushcart from the
linked vehicle, so an unlinked PUSHCART* login came back with vehicleType null
and isPushcart false, and the worker app fell through to the TATA ACE model.

Zone assignment is taken from the worker's own checkpoint street
(swms_users.full_name -> swms_workers.worker_name -> that worker's streets ->
their zone), not guessed from the cart code.

DRY RUN by default. Pass --apply to write.
"""
import os
import re
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join('backend_fastapi', '.env'))

APPLY = '--apply' in sys.argv

url = os.getenv('DATABASE_URL')
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)
conn = psycopg2.connect(url)
cur = conn.cursor()


def nrm(v):
    return ''.join(ch for ch in (v or '').upper() if ch.isalnum())


# ---------------------------------------------------------------- existing
cur.execute("SELECT id, vehicle_number, vehicle_type FROM swms_vehicles")
vehicles = cur.fetchall()
cart_by_zone = {}
for vid, vnum, vtype in vehicles:
    if (vtype or '').upper() != 'PUSH CART':
        continue
    key = vnum.split('_')[1] if '_' in (vnum or '') else None
    if key:
        cart_by_zone[key.upper()] = vid
print('PUSH CART vehicles found:', {k: v for k, v in cart_by_zone.items()})

cur.execute("SELECT id, worker_name FROM swms_workers")
workers = {nrm(n): i for i, n in cur.fetchall()}

# worker -> zones, from that worker's checkpoint streets
cur.execute("""
  SELECT w.id, string_agg(DISTINCT s.zone, ' | '), string_agg(DISTINCT s.ward, ' | ')
  FROM swms_workers w
  JOIN swms_qr_checkpoints q ON q.worker_id = w.id
  JOIN swms_streets s ON s.id = q.street_id
  GROUP BY w.id
""")
worker_zone = {wid: (zones.split(' | ')[0], wards.split(' | ')[0]) for wid, zones, wards in cur.fetchall()}


def zone_key(zone):
    if not zone:
        return None
    z = zone.upper()
    for k in cart_by_zone:
        if k in z:
            return k
    return None


def best_worker(full_name):
    """Match full_name to a worker. Exact first, then shared-word overlap.

    Spellings drift between the roster and the worker table ("Joothi Mani" vs
    "Mani"), so a shared word is accepted but only when it is unambiguous.
    """
    if not full_name:
        return None, None, None
    key = nrm(full_name)
    exact = workers.get(key)
    if exact:
        return exact, worker_zone.get(exact, (None, None))[0], worker_zone.get(exact, (None, None))[1]
    words = set(re.findall(r'[A-Z]{3,}', full_name.upper()))
    if not words:
        return None, None, None
    # A worker matches when every word of their name appears in the account's
    # name, so "Joothi Mani" reaches the worker "Mani". Longest name wins, and
    # the match must be unique.
    hits = []
    for wname, wid in workers.items():
        wwords = set(re.findall(r'[A-Z]{3,}', wname))
        if wwords and wwords <= words:
            hits.append((len(wname), wid, wname))
    if not hits:
        return None, None, None
    hits.sort(reverse=True)
    if len(hits) > 1 and hits[0][0] == hits[1][0]:
        return None, None, None  # ambiguous, leave it to a human
    wid = hits[0][1]
    z, w = worker_zone.get(wid, (None, None))
    return wid, z, w


# ---------------------------------------------------------------- targets
cur.execute("""
  SELECT u.id, u.username, u.full_name, u.vehicle_id, u.zone, u.ward, u.worker_id
  FROM swms_users u
  WHERE u.username ILIKE 'PUSHCART%%'
  ORDER BY u.username
""")
targets = cur.fetchall()

print(f'\n{"username":<18} {"full_name":<20} {"zone":<13} {"ward":<10} {"vehicle":<20} action')
print('-' * 100)
plan = []
for uid, un, fn, cur_vid, cur_zone, cur_ward, cur_wid in targets:
    m_wid, wzone, wward = best_worker(fn)
    wid = cur_wid or m_wid
    zone = cur_zone or wzone
    ward = cur_ward or wward
    key = zone_key(zone)
    vid = cart_by_zone.get(key) if key else None

    action = []
    if cur_vid != vid:
        action.append(f'vehicle {cur_vid} -> {vid}')
    if zone != cur_zone:
        action.append(f'zone {cur_zone!r} -> {zone!r}')
    if ward != cur_ward:
        action.append(f'ward {cur_ward!r} -> {ward!r}')
    if wid != cur_wid:
        action.append(f'worker {cur_wid} -> {wid}')

    plan.append({'uid': uid, 'vid': vid, 'zone': zone, 'ward': ward, 'wid': wid,
                 'user': un, 'before_vid': cur_vid})
    print(f'{un:<18} {str(fn):<20} {str(zone):<13} {str(ward):<10} {str(vid):<20} {"; ".join(action) or "no change"}')

unresolved = [p for p in plan if not p['vid']]
if unresolved:
    print(f'\n!! {len(unresolved)} account(s) could not be resolved to a PUSH CART vehicle:')
    for p in unresolved:
        print(f"   {p['user']}  (zone={p['zone']!r})")

if not APPLY:
    print('\nDRY RUN — nothing written. Re-run with --apply to commit.')
    conn.rollback()
    conn.close()
    sys.exit(0)

print('Applying...')

# Every zone needs a PUSH CART vehicle. The West zone had none, so a West
# cart would otherwise still be unlinkable.
missing_zones = {'EAST', 'CENTRAL', 'SOUTH', 'NORTH', 'WEST'} - set(cart_by_zone)
for key in sorted(missing_zones):
    num = f'PUSHCART_{key}_01'
    name = f'Push Cart {key.title()}'
    cur.execute(
        'INSERT INTO swms_vehicles (vehicle_type, vehicle_number, vehicle_name) VALUES (%s,%s,%s) RETURNING id',
        ('PUSH CART', num, name),
    )
    new_id = cur.fetchone()[0]
    cart_by_zone[key] = new_id
    print(f'  created missing vehicle: {num} (id={new_id})')

for p in plan:
    # Re-resolve now that a West vehicle exists.
    if not p['vid']:
        key = zone_key(p['zone'])
        if key:
            p['vid'] = cart_by_zone.get(key)

    if not p['vid']:
        # Last resort so the account at least reports a PUSH CART type, which
        # is what decides its dashboard. Named after the login so it is clear
        # in the admin vehicle list.
        num = p['user']
        cur.execute('SELECT id FROM swms_vehicles WHERE vehicle_number=%s', (num,))
        row = cur.fetchone()
        if row:
            p['vid'] = row[0]
        else:
            cur.execute(
                'INSERT INTO swms_vehicles (vehicle_type, vehicle_number, vehicle_name) VALUES (%s,%s,%s) RETURNING id',
                ('PUSH CART', num, f'Push Cart {p["user"]}'),
            )
            p['vid'] = cur.fetchone()[0]
        print(f"  {p['user']}: zone unknown, so linked to its own PUSH CART vehicle id={p['vid']}")

    cur.execute(
        'UPDATE swms_users SET vehicle_id=%s, zone=COALESCE(zone,%s), ward=COALESCE(ward,%s), worker_id=COALESCE(worker_id,%s) WHERE id=%s',
        (p['vid'], p['zone'], p['ward'], p['wid'], p['uid']),
    )
    print(f"  {p['user']}: vehicle_id={p['vid']} zone={p['zone']} ward={p['ward']} worker_id={p['wid']}")
conn.commit()

# ---------------------------------------------------------------- verify
cur.execute("""
  SELECT u.username, v.vehicle_type, u.zone
  FROM swms_users u LEFT JOIN swms_vehicles v ON v.id = u.vehicle_id
  WHERE u.username ILIKE 'PUSHCART%%' ORDER BY u.username
""")
print('\n=== after ===')
for un, vt, z in cur.fetchall():
    print(f'  {un:<18} vehicle_type={str(vt):<12} zone={z}')

conn.close()
