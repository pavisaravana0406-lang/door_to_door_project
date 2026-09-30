"""
Link the five BOV accounts to BOV vehicles so the API reports BOV as the type.

Two of the five (TN66AP0965, TN66AQ0794) already have a BOV row in
swms_vehicles that no user pointed at. The other three have no vehicle row at
all, so build_assignment() returned a null vehicleType and those logins landed
on the TATA ACE dashboard.

Zone and ward come from the printed QR card the plate is issued on: each plate
appears on exactly one card in CCMC_QR_ROUTES, and that card's zone and ward
number are the CCMC ward reference. This is the physical assignment, so it does
not depend on a worker row that these accounts do not have.

DRY RUN by default. Pass --apply to write.
"""
import os
import re
import difflib
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join('backend_fastapi', '.env'))

APPLY = '--apply' in sys.argv
TARGETS = ['TN66AP0965', 'TN66AP1181', 'TN66P0982', 'TN66AQ0794', 'TN66APO948']

url = os.getenv('DATABASE_URL')
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql://', 1)
conn = psycopg2.connect(url)
cur = conn.cursor()


def nrm(v):
    return ''.join(ch for ch in (v or '').upper() if ch.isalnum())


# ---- zone/ward from the printed card each plate is issued on ----
ZONE_LETTER = {'NORTH': 'North Zone', 'SOUTH': 'South Zone', 'EAST': 'East Zone',
               'WEST': 'West Zone', 'CENTRAL': 'Central Zone'}

src = open('src/components/SWMSStreetScanQRCard.tsx', encoding='utf-8').read()
card_street = {}
for m in re.finditer(r"\{[^{}]*streetName:\s*'([^']+)'[^{}]*\}", src):
    blk = m.group(0)

    def g(key):
        mm = re.search(rf"{key}:\s*'([^']*)'", blk)
        return mm.group(1) if mm else ''

    plate = nrm(g('vehicleNo'))
    if plate:
        card_street[plate] = g('streetName')

# Neon is authoritative for zone and ward. The printed cards disagree with
# themselves (MARUTHI ENVUE is tagged North Zone but Ward 35, which is a West
# ward), so the card only supplies the street name and the zone is looked up.
cur.execute('SELECT street_name, zone, ward FROM swms_streets')
neon_streets = [(n, z, w) for n, z, w in cur.fetchall()]


def neon_match(street):
    """
    Best Neon street for a card street name.

    Neon and the printed cards spell several of the same streets differently
    (MARUTHI ENVUE / MARUTHI AVENUE, RAMASAMY KOONARCUT ROAD / RAMASAMY KONAR
    CUT ROAD), so compare on characters rather than words.
    """
    if not street:
        return None
    key = nrm(street)
    for n, z, w in neon_streets:
        if nrm(n) == key:
            return (n, z, w)
    best, score = None, 0.0
    for n, z, w in neon_streets:
        s = difflib.SequenceMatcher(None, key, nrm(n)).ratio()
        if s > score:
            best, score = (n, z, w), s
    return best if score >= 0.72 else None


print('plate -> resolved street / zone / ward:')
for t in TARGETS:
    st = card_street.get(nrm(t))
    hit = neon_match(st) if st else None
    print(f'  {t:<14} card={str(st):<30} -> {hit if hit else "UNRESOLVED"}')

cur.execute("SELECT id, vehicle_number, vehicle_name FROM swms_vehicles WHERE vehicle_type='BOV'")
existing = {nrm(vn): (vid, nm) for vid, vn, nm in cur.fetchall()}
print('\nexisting BOV vehicle rows:', existing)

cur.execute("""
  SELECT u.id, u.username, u.vehicle_id, u.zone, u.ward
  FROM swms_users u WHERE u.username = ANY(%s) ORDER BY u.username
""", (TARGETS,))
users = cur.fetchall()

print(f'\n{"username":<14} {"vehicle":<22} {"zone":<14} {"ward":<10} action')
print('-' * 96)
plan = []
for uid, un, cur_vid, cur_zone, cur_ward in users:
    key = nrm(un)
    st = card_street.get(key)
    hit = neon_match(st) if st else None
    zone = hit[1] if hit else None
    ward = hit[2] if hit else None
    vid = existing.get(key, (None, None))[0]
    action = []
    if cur_vid != vid:
        action.append(f'vehicle {cur_vid} -> {vid or "CREATE"}')
    if cur_zone != zone:
        action.append(f'zone {cur_zone!r} -> {zone!r}')
    if cur_ward != ward:
        action.append(f'ward {cur_ward!r} -> {ward!r}')
    plan.append({'uid': uid, 'user': un, 'key': key, 'vid': vid, 'zone': zone, 'ward': ward})
    print(f'{un:<14} {str(vid or "CREATE"):<22} {str(zone):<14} {str(ward):<10} {"; ".join(action) or "no change"}')

missing = [p for p in plan if not p['zone']]
for p in missing:
    print(f"!! {p['user']}: plate is not on any printed card, so zone/ward stay unset (type is still set)")

if not APPLY:
    print('\nDRY RUN — nothing written. Re-run with --apply to commit.')
    conn.rollback()
    conn.close()
    sys.exit(0)

print('\nApplying...')
for p in plan:
    if not p['vid']:
        cur.execute("SELECT id FROM swms_vehicles WHERE vehicle_number=%s", (p['user'],))
        row = cur.fetchone()
        if row:
            p['vid'] = row[0]
        else:
            cur.execute(
                'INSERT INTO swms_vehicles (vehicle_type, vehicle_number, vehicle_name) VALUES (%s,%s,%s) RETURNING id',
                ('BOV', p['user'], f'Battery Vehicle {p["user"]}'),
            )
            p['vid'] = cur.fetchone()[0]
            print(f'  created BOV vehicle for {p["user"]} (id={p["vid"]})')
    cur.execute(
        'UPDATE swms_users SET vehicle_id=%s, zone=COALESCE(zone,%s), ward=COALESCE(ward,%s) WHERE id=%s',
        (p['vid'], p['zone'], p['ward'], p['uid']),
    )
    print(f'  {p["user"]}: vehicle_id={p["vid"]} type=BOV zone={p["zone"]} ward={p["ward"]}')
conn.commit()

print('\n=== after ===')
cur.execute("""
  SELECT u.username, v.vehicle_type, u.zone, u.ward
  FROM swms_users u LEFT JOIN swms_vehicles v ON v.id = u.vehicle_id
  WHERE u.username = ANY(%s) ORDER BY u.username
""", (TARGETS,))
for un, vt, z, w in cur.fetchall():
    print(f'  {un:<14} vehicle_type={str(vt):<8} zone={z} ward={w}')

conn.close()
