import os
import sys
from pathlib import Path

# Ensure backend_fastapi directory is in Python path for imports
_backend_dir = str(Path(__file__).parent.resolve())
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import io
import base64
import hashlib
import secrets
import zipfile
from datetime import datetime, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from sqlalchemy import func, text
from sqlalchemy.orm import Session

import bcrypt

# Automatic QR image generation (pure-python QR encoder + Pillow)
import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image

from database import engine, Base, get_db, SessionLocal, SQLALCHEMY_DATABASE_URL
import models
import schemas

# Create database tables automatically in Neon PostgreSQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Coimbatore Solid Waste Management System (SWMS) API",
    description="FastAPI Backend with local SQLite database support and optional Neon PostgreSQL connectivity",
    version="2.1.0"
)

# CORS Middleware configuration to allow React Vite frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------------------
# QR identifier conventions — the QR payload encodes ONLY the unique id, e.g. "E-SCAN1"
# Format: <Zone Letter>-SCAN<number>   (East → E-SCAN1, Central → C-SCAN1, …)
# ---------------------------------------------------------------------------------------

ZONE_CODE = {
    "Central Zone": "Z1",
    "East Zone": "Z2",
    "West Zone": "Z3",
    "North Zone": "Z4",
    "South Zone": "Z5",
}

ZONE_SCAN_PREFIX = {
    "Central Zone": "C",
    "East Zone": "E",
    "West Zone": "W",
    "North Zone": "N",
    "South Zone": "S",
}

ALL_ZONES = list(ZONE_CODE.keys())

# Directory where scan evidence photos are stored (filesystem, survives redeploy if persistent disk attached).
PHOTO_STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "photos")
os.makedirs(PHOTO_STORAGE_DIR, exist_ok=True)


def zone_code_for(zone_name: str) -> str:
    return ZONE_CODE.get(zone_name or "", "Z0")


def make_qr_id(zone: str, seq: int) -> str:
    return f"{ZONE_SCAN_PREFIX.get(zone or '', 'X')}-SCAN{seq}"


def next_zone_seq(db: Session, zone: str) -> int:
    """Next checkpoint number within a zone (no duplicate QR ids are ever generated)."""
    if not zone:
        return 1
    last = (
        db.query(models.QRCheckpointModel)
        .filter(models.QRCheckpointModel.zone == zone)
        .order_by(models.QRCheckpointModel.seq.desc())
        .first()
    )
    return (last.seq + 1) if last else 1


def make_qr_png(qr_text: str, box_size: int = 14, border: int = 4) -> bytes:
    """Dynamically generate a high-quality scannable QR code PNG image."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(qr_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------------------
# Security helpers — passwords are hashed with bcrypt, tokens stored as SHA-256 hashes
# ---------------------------------------------------------------------------------------


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issue_token(db: Session, user_id: int) -> str:
    raw = secrets.token_hex(24)
    db.add(models.AuthTokenModel(token_hash=_hash_token(raw), user_id=user_id))
    db.commit()
    return raw


def get_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def get_current_user(db: Session, token: Optional[str]) -> models.UserModel:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    token_rec = db.query(models.AuthTokenModel).filter(
        models.AuthTokenModel.token_hash == _hash_token(token)
    ).first()
    if not token_rec:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
    user = db.query(models.UserModel).filter(models.UserModel.id == token_rec.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    return user


def build_assignment(db: Session, user: models.UserModel) -> schemas.AssignmentSchema:
    vehicle = None
    worker = None
    if user.vehicle_id:
        vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == user.vehicle_id).first()
    if user.worker_id:
        worker = db.query(models.WorkerModel).filter(models.WorkerModel.id == user.worker_id).first()

    vehicle_type = vehicle.vehicle_type if vehicle else None
    is_pushcart = bool(vehicle_type and vehicle_type.lower() == "pushcart")

    return schemas.AssignmentSchema(
        userId=user.id,
        username=user.username,
        role=user.role,
        fullName=user.full_name,
        vehicleId=vehicle.id if vehicle else None,
        vehicleType=vehicle_type,
        vehicleName=vehicle.vehicle_name if vehicle else None,
        vehicleNumber=(vehicle.vehicle_number if vehicle and not is_pushcart else None),
        workerId=worker.id if worker else None,
        workerName=worker.worker_name if worker else None,
        workerCode=worker.worker_code if worker else None,
        workerPhone=worker.worker_phone if worker else None,
        isPushcart=is_pushcart,
        zone=user.zone,
        ward=user.ward,
    )


def access_error(user: models.UserModel, street: models.StreetModel) -> (bool, Optional[str]):
    """Verify a scanned checkpoint street belongs to the logged-in user's assigned zone/ward."""
    if user.zone and street.zone and user.zone.lower() != street.zone.lower():
        return True, f"This checkpoint belongs to {street.zone}, which is outside your assigned zone ({user.zone})."
    if user.ward and street.ward and user.ward.lower() != street.ward.lower():
        return True, f"This checkpoint belongs to {street.ward}, which is outside your assigned ward ({user.ward})."
    return False, None


def today_str() -> str:
    return date.today().isoformat()


def get_checkpoint_record(db: Session, qr: models.QRCheckpointModel, cdate: str) -> Optional[models.CollectionRecordModel]:
    return db.query(models.CollectionRecordModel).filter(
        models.CollectionRecordModel.qr_code == qr.qr_code,
        models.CollectionRecordModel.collection_date == cdate
    ).first()


def to_checkpoint_schema(db: Session, st: models.StreetModel, cp: models.QRCheckpointModel,
                         cdate: str) -> schemas.CheckpointSchema:
    rec = get_checkpoint_record(db, cp, cdate)
    status_v = rec.status if rec else "Pending"
    worker = db.query(models.WorkerModel).filter(models.WorkerModel.id == cp.worker_id).first() if cp.worker_id else None
    
    photos_list = []
    if rec and getattr(rec, 'photos', None):
        try:
            photos_list = json.loads(rec.photos)
        except Exception:
            photos_list = []

    return schemas.CheckpointSchema(
        qrId=cp.qr_code,
        position=cp.position,
        streetId=st.id,
        streetName=st.street_name,
        zone=st.zone,
        ward=st.ward,
        area=st.area,
        status=status_v,
        recordedAt=rec.scanned_at.strftime("%Y-%m-%d %H:%M:%S") if rec else None,
        remarks=rec.remarks if rec else None,
        photos=photos_list,
        zoneCode=cp.zone_code,
        checkpointNumber=cp.seq,
        households=cp.households,
        workerName=cp.worker_id and worker.worker_name if worker else None,
        workerCode=cp.worker_id and worker.worker_code if worker else None,
        workerContact=cp.worker_id and worker.worker_phone if worker else None,
        siName=cp.si_name,
        siContact=cp.si_contact,
        ssName=cp.ss_name,
        ssContact=cp.ss_contact,
        cssName=cp.css_name,
        cssContact=cp.css_contact,
    )


def to_checkpoint_admin_schema(db: Session, cp: models.QRCheckpointModel) -> schemas.CheckpointAdminSchema:
    street = db.query(models.StreetModel).filter(models.StreetModel.id == cp.street_id).first()
    worker = db.query(models.WorkerModel).filter(models.WorkerModel.id == cp.worker_id).first() if cp.worker_id else None
    return schemas.CheckpointAdminSchema(
        id=cp.id,
        qrId=cp.qr_code,
        zone=cp.zone,
        zoneCode=cp.zone_code or zone_code_for(cp.zone),
        ward=street.ward if street else "",
        streetName=street.street_name if street else "",
        area=street.area if street else None,
        checkpointNumber=cp.seq,
        households=cp.households,
        workerName=worker.worker_name if worker else None,
        workerCode=worker.worker_code if worker else None,
        workerContact=worker.worker_phone if worker else None,
        siName=cp.si_name,
        siContact=cp.si_contact,
        ssName=cp.ss_name,
        ssContact=cp.ss_contact,
        cssName=cp.css_name,
        cssContact=cp.css_contact,
        status=cp.status,
        position=cp.position,
        createdAt=cp.created_at.strftime("%Y-%m-%d %H:%M:%S") if cp.created_at else None,
        imageUrl=f"/api/admin/qr/image?qrId={cp.qr_code}",
    )


def get_admin_user(db: Session, token: Optional[str]) -> models.UserModel:
    user = get_current_user(db, token)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required for QR checkpoint management.")
    return user


def get_dashboard_data(db: Session, user: models.UserModel) -> schemas.DashboardResponse:
    q = db.query(models.StreetModel)
    if user.zone:
        q = q.filter(models.StreetModel.zone == user.zone)
    if user.ward:
        q = q.filter(models.StreetModel.ward == user.ward)
    streets = q.order_by(models.StreetModel.street_name).all()

    cdate = today_str()
    street_list: List[schemas.StreetDashboardSchema] = []
    totals = {"t": 0, "c": 0, "n": 0, "p": 0}

    for st in streets:
        checkpoints = (
            db.query(models.QRCheckpointModel)
            .filter(models.QRCheckpointModel.street_id == st.id)
            .order_by(models.QRCheckpointModel.position)
            .all()
        )
        cp_list = [to_checkpoint_schema(db, st, cp, cdate) for cp in checkpoints]
        for cp in cp_list:
            totals["t"] += 1
            if cp.status == "Collected":
                totals["c"] += 1
            elif cp.status == "Not Collected":
                totals["n"] += 1
            else:
                totals["p"] += 1
        street_list.append(schemas.StreetDashboardSchema(
            streetId=st.id,
            streetName=st.street_name,
            zone=st.zone,
            ward=st.ward,
            area=st.area,
            checkpoints=cp_list,
        ))

    total = totals["t"]
    pct = round((totals["c"] / total) * 100) if total > 0 else 0
    if total > 0 and totals["c"] == total:
        overall_status = "Covered"
    elif totals["c"] == 0:
        overall_status = "Not Covered"
    else:
        overall_status = "Partially Covered"

    stats = schemas.DashboardStatsSchema(
        totalStreets=len(street_list),
        totalCheckpoints=total,
        collectedCheckpoints=totals["c"],
        notCollectedCheckpoints=totals["n"],
        pendingCheckpoints=totals["p"],
        coveragePercentage=pct,
        status=overall_status,
    )
    return schemas.DashboardResponse(stats=stats, streets=street_list)


def to_record_volume(db: Session, rec: models.CollectionRecordModel) -> schemas.CollectionRecordResponseSchema:
    street = db.query(models.StreetModel).filter(models.StreetModel.id == rec.street_id).first()
    user = db.query(models.UserModel).filter(models.UserModel.id == rec.user_id).first()
    vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == rec.vehicle_id).first() if rec.vehicle_id else None
    worker = db.query(models.WorkerModel).filter(models.WorkerModel.id == rec.worker_id).first() if rec.worker_id else None
    is_pushcart = bool(vehicle and vehicle.vehicle_type and vehicle.vehicle_type.lower() == "pushcart")
    return schemas.CollectionRecordResponseSchema(
        id=rec.id,
        recordNo=rec.record_no,
        qrCode=rec.qr_code,
        streetId=rec.street_id,
        streetName=street.street_name if street else None,
        zone=street.zone if street else None,
        ward=street.ward if street else None,
        area=street.area if street else None,
        userId=rec.user_id,
        username=user.username if user else None,
        vehicleType=vehicle.vehicle_type if vehicle else None,
        vehicleNumber=(vehicle.vehicle_number if vehicle and not is_pushcart else None),
        workerName=worker.worker_name if worker else None,
        workerCode=worker.worker_code if worker else None,
        status=rec.status,
        remarks=rec.remarks,
        scannedAt=rec.scanned_at.strftime("%Y-%m-%d %H:%M:%S"),
        latitude=rec.latitude,
        longitude=rec.longitude,
        collectionDate=rec.collection_date,
    )


# ---------------------------------------------------------------------------------------
# Demo seed data (safe — runs only when the users table is empty)
# ---------------------------------------------------------------------------------------


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(models.UserModel).count() > 0:
            return

        auto_tipper = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AE6121", vehicle_name="TATA ACE")
        vehicle2 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AD6465", vehicle_name="TATA ACE")
        vehicle3 = models.VehicleModel(vehicle_type="BOV", vehicle_number="TN66APO948", vehicle_name="BOV")
        pushcart1 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        pushcart2 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        # Central Zone vehicles
        central_tata1 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AD8373", vehicle_name="TATA ACE")
        central_tata2 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AQ1114", vehicle_name="TATA ACE")
        central_bov = models.VehicleModel(vehicle_type="BOV", vehicle_number="TN66AQ0794", vehicle_name="BOV")
        central_pc1 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        central_pc2 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        # South Zone vehicles
        south_tata1 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AM0219", vehicle_name="TATA ACE")
        south_tata2 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AQ1153", vehicle_name="TATA ACE")
        south_bov = models.VehicleModel(vehicle_type="BOV", vehicle_number="TN66P0982", vehicle_name="BOV")
        south_pc1 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        south_pc2 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        # West Zone vehicles
        west_tata1 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AQ1287", vehicle_name="TATA ACE")
        west_tata2 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AC9176", vehicle_name="TATA ACE")
        west_bov = models.VehicleModel(vehicle_type="BOV", vehicle_number="TN66AP1181", vehicle_name="BOV")
        west_pc1 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        west_pc2 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        # North Zone vehicles
        north_tata1 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AC1906", vehicle_name="TATA ACE")
        north_tata2 = models.VehicleModel(vehicle_type="TATA ACE", vehicle_number="TN66AM0270", vehicle_name="TATA ACE")
        north_bov = models.VehicleModel(vehicle_type="BOV", vehicle_number="TN66AP0965", vehicle_name="BOV")
        north_pc1 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        north_pc2 = models.VehicleModel(vehicle_type="Pushcart", vehicle_number=None, vehicle_name="Pushcart")
        db.add_all([auto_tipper, vehicle2, vehicle3, pushcart1, pushcart2, central_tata1, central_tata2, central_bov, central_pc1, central_pc2, south_tata1, south_tata2, south_bov, south_pc1, south_pc2, west_tata1, west_tata2, west_bov, west_pc1, west_pc2, north_tata1, north_tata2, north_bov, north_pc1, north_pc2])

        kumar = models.WorkerModel(worker_code="PC-001", worker_name="Kumar", worker_phone="9840212341")
        selvam = models.WorkerModel(worker_code="PC-002", worker_name="Selvam", worker_phone="9840212342")
        ravi = models.WorkerModel(worker_code="PC-003", worker_name="Ravi", worker_phone="9840212343")
        db.add_all([kumar, selvam, ravi])

        # Sanitary staff (SI / SS / CSS) assignable to checkpoints
        si_annamalai = models.StaffModel(staff_code="SI-001", staff_name="Annamalai K", staff_phone="9843010011", role="SI")
        si_priya = models.StaffModel(staff_code="SI-002", staff_name="Priya R", staff_phone="9843010012", role="SI")
        si_velu = models.StaffModel(staff_code="SI-003", staff_name="Velu S", staff_phone="9843010013", role="SI")
        ss_manoj = models.StaffModel(staff_code="SS-001", staff_name="Manoj Kumar S", staff_phone="9842211220", role="SS")
        ss_deepa = models.StaffModel(staff_code="SS-002", staff_name="Deepa M", staff_phone="9842211221", role="SS")
        ss_arun = models.StaffModel(staff_code="SS-003", staff_name="Arun K", staff_phone="9842211222", role="SS")
        css_arumugam = models.StaffModel(staff_code="CSS-001", staff_name="Dr. V. Arumugam", staff_phone="9842266221", role="CSS")
        css_rajkumar = models.StaffModel(staff_code="CSS-002", staff_name="Rajkumar T", staff_phone="9842266222", role="CSS")
        css_mary = models.StaffModel(staff_code="CSS-003", staff_name="Mary Grace", staff_phone="9842266223", role="CSS")
        db.add_all([si_annamalai, si_priya, si_velu, ss_manoj, ss_deepa, ss_arun, css_arumugam, css_rajkumar, css_mary])
        db.flush()

        # ── East Zone (Ward 24): 5 streets → E-SCAN1..5 ──────────────────────
        sree_nagar = models.StreetModel(street_name="Sree Nagar", zone="East Zone", ward="Ward 24", area="Sree Nagar")
        mageshwari_nagar = models.StreetModel(street_name="Mageshwari Nagar", zone="East Zone", ward="Ward 24", area="Mageshwari Nagar")
        ngr_nagar = models.StreetModel(street_name="NGR Nagar", zone="East Zone", ward="Ward 24", area="NGR Nagar")
        thiyagi_kumaran_veedhi = models.StreetModel(street_name="Thiyagi Kumaran Veedhi", zone="East Zone", ward="Ward 24", area="Thiyagi Kumaran Veedhi")
        kalyana_sundharam = models.StreetModel(street_name="Kalyana Sundharam Street", zone="East Zone", ward="Ward 24", area="Kalyana Sundharam Street")
        # ── Central Zone (Ward 49) ──
        ponni_street = models.StreetModel(street_name="Ponni Street", zone="Central Zone", ward="Ward 49", area="Ponni Street")
        perameswaran_layout = models.StreetModel(street_name="Perameswaran Layout", zone="Central Zone", ward="Ward 49", area="Perameswaran Layout")
        kandhasamy_layout = models.StreetModel(street_name="Kandhasamy Layout", zone="Central Zone", ward="Ward 49", area="Kandhasamy Layout")
        lakshimi_mill_signal = models.StreetModel(street_name="Lakshimi Mill Signal", zone="Central Zone", ward="Ward 49", area="Lakshimi Mill Signal")
        mariyamman_kovil = models.StreetModel(street_name="Mariyamman Kovil Street", zone="Central Zone", ward="Ward 49", area="Mariyamman Kovil Street")
        # ── South Zone (Ward 88) ──
        palani_andavar = models.StreetModel(street_name="Palani Andavar Kovil Veedhi", zone="South Zone", ward="Ward 88", area="Palani Andavar Kovil Veedhi")
        kgk_main_road = models.StreetModel(street_name="KGK Main Road", zone="South Zone", ward="Ward 88", area="KGK Main Road")
        nagamma_nayagar = models.StreetModel(street_name="Nagamma Nayagar Veedhi", zone="South Zone", ward="Ward 88", area="Nagamma Nayagar Veedhi")
        alagachi_thottam = models.StreetModel(street_name="Alagachi Thottam", zone="South Zone", ward="Ward 88", area="Alagachi Thottam")
        muthusamy_servai = models.StreetModel(street_name="Muthusamy Servai Veedhi", zone="South Zone", ward="Ward 88", area="Muthusamy Servai Veedhi")
        # ── West Zone (Ward 35) ──
        kk_nagar = models.StreetModel(street_name="KK Nagar", zone="West Zone", ward="Ward 35", area="KK Nagar")
        ranganadhan_koil = models.StreetModel(street_name="Ranganadhan Koil Street", zone="West Zone", ward="Ward 35", area="Ranganadhan Koil Street")
        bajana_kovil = models.StreetModel(street_name="Bajana Kovil Veedhi", zone="West Zone", ward="Ward 35", area="Bajana Kovil Veedhi")
        parinagar_3_veedhi = models.StreetModel(street_name="Parinagar 3 Veedhi Cut Road", zone="West Zone", ward="Ward 35", area="Parinagar 3 Veedhi Cut Road")
        ramasamy_konar = models.StreetModel(street_name="Ramasamy Konar", zone="West Zone", ward="Ward 35", area="Ramasamy Konar")
        # ── North Zone (Ward 04) ──
        madura_enclave = models.StreetModel(street_name="Madura Enclave", zone="North Zone", ward="Ward 04", area="Madura Enclave")
        senthura_puram = models.StreetModel(street_name="Senthura Puram", zone="North Zone", ward="Ward 04", area="Senthura Puram")
        manachi_nagar = models.StreetModel(street_name="Manachi Nagar, SMP Estate", zone="North Zone", ward="Ward 04", area="Manachi Nagar, SMP Estate")
        visaga_garden = models.StreetModel(street_name="Visaga Garden", zone="North Zone", ward="Ward 04", area="Visaga Garden")
        maruthi_avenue = models.StreetModel(street_name="Maruthi Avenue", zone="North Zone", ward="Ward 04", area="Maruthi Avenue")
        db.add_all([
            sree_nagar, mageshwari_nagar, ngr_nagar, thiyagi_kumaran_veedhi, kalyana_sundharam,
            ponni_street, perameswaran_layout, kandhasamy_layout, lakshimi_mill_signal, mariyamman_kovil,
            palani_andavar, kgk_main_road, nagamma_nayagar, alagachi_thottam, muthusamy_servai,
            kk_nagar, ranganadhan_koil, bajana_kovil, parinagar_3_veedhi, ramasamy_konar,
            madura_enclave, senthura_puram, manachi_nagar, visaga_garden, maruthi_avenue,
        ])
        db.flush()

        # ── East Zone sanitary staff ──
        si_gerard = models.StaffModel(staff_code="SI-004", staff_name="S.R. GERARD SATHIYA PUNITHAN", staff_phone="9942504589", role="SI")
        ss_vibin = models.StaffModel(staff_code="SS-004", staff_name="VIBIN", staff_phone="8925748584", role="SS")
        css_vengatesh = models.StaffModel(staff_code="CSS-004", staff_name="VENGATESH", staff_phone="8072092485", role="CSS")
        db.add_all([si_gerard, ss_vibin, css_vengatesh])
        db.flush()

        # ── Central Zone sanitary staff (Ward 49) ──
        si_loganathan = models.StaffModel(staff_code="SI-005", staff_name="Loganathan", staff_phone="9489206052", role="SI")
        ss_muthusamy = models.StaffModel(staff_code="SS-005", staff_name="MUTHUSAMY", staff_phone="9442104143", role="SS")
        css_yamuna = models.StaffModel(staff_code="CSS-005", staff_name="Yamuna", staff_phone="6385728857", role="CSS")
        db.add_all([si_loganathan, ss_muthusamy, css_yamuna])
        db.flush()

        # ── East Zone workers (Ward 24) ──
        murali = models.WorkerModel(worker_code="PC-004", worker_name="MURALI", worker_phone="96779713175")
        yoga_raj = models.WorkerModel(worker_code="PC-005", worker_name="YOGA RAJ", worker_phone="8220110220")
        priya_east = models.WorkerModel(worker_code="PC-006", worker_name="PRIYA", worker_phone="7397587127")
        susila = models.WorkerModel(worker_code="PC-007", worker_name="SUSILA", worker_phone="7397587127")
        aanandhan = models.WorkerModel(worker_code="PC-008", worker_name="AANANDHAN", worker_phone="8098347628")
        db.add_all([murali, yoga_raj, priya_east, susila, aanandhan])
        db.flush()

        # ── Central Zone workers (Ward 49) ──
        surya = models.WorkerModel(worker_code="PC-009", worker_name="Surya", worker_phone="8870418209")
        gopala_krishnanan = models.WorkerModel(worker_code="PC-010", worker_name="Gopala Krishnanan", worker_phone="9751099379")
        palanisamy = models.WorkerModel(worker_code="PC-011", worker_name="Palanisamy", worker_phone="9677966465")
        vadivukarasi = models.WorkerModel(worker_code="PC-012", worker_name="Vadivukarasi", worker_phone="7667769132")
        udayakumar = models.WorkerModel(worker_code="PC-013", worker_name="Udayakumar", worker_phone="8056960451")
        db.add_all([surya, gopala_krishnanan, palanisamy, vadivukarasi, udayakumar])
        db.flush()

        # ── South Zone sanitary staff (Ward 88) ──
        si_zaheer = models.StaffModel(staff_code="SI-006", staff_name="Zaheer Hussain", staff_phone="7339204132", role="SI")
        ss_muthuraj = models.StaffModel(staff_code="SS-006", staff_name="Muthuraj", staff_phone="8925975896", role="SS")
        css_gurumoorthy = models.StaffModel(staff_code="CSS-006", staff_name="Gurumoorthy", staff_phone="8903593614", role="CSS")
        db.add_all([si_zaheer, ss_muthuraj, css_gurumoorthy])
        db.flush()

        # ── South Zone workers (Ward 88) ──
        karthick_s = models.WorkerModel(worker_code="PC-014", worker_name="Karthick", worker_phone="9880433224")
        selva_raj = models.WorkerModel(worker_code="PC-015", worker_name="Selva Raj", worker_phone="9366113970")
        sellamuthu = models.WorkerModel(worker_code="PC-016", worker_name="Sellamuthu", worker_phone=None)
        mahendhiran = models.WorkerModel(worker_code="PC-017", worker_name="Mahendhiran", worker_phone=None)
        sathya_s = models.WorkerModel(worker_code="PC-018", worker_name="Sathya", worker_phone=None)
        db.add_all([karthick_s, selva_raj, sellamuthu, mahendhiran, sathya_s])
        db.flush()

        # ── West Zone sanitary staff (Ward 35) ──
        si_rajendran = models.StaffModel(staff_code="SI-007", staff_name="Rajendran", staff_phone="8925968002", role="SI")
        ss_anandh = models.StaffModel(staff_code="SS-007", staff_name="Anandh", staff_phone="8925968018", role="SS")
        css_balachandar = models.StaffModel(staff_code="CSS-007", staff_name="Balachandar", staff_phone="9041300350", role="CSS")
        db.add_all([si_rajendran, ss_anandh, css_balachandar])
        db.flush()

        # ── West Zone workers (Ward 35) ──
        saravana_kumar = models.WorkerModel(worker_code="PC-019", worker_name="Saravana Kumar", worker_phone="9750545166")
        senraj = models.WorkerModel(worker_code="PC-020", worker_name="Senraj", worker_phone="8489084317")
        joothi_mani = models.WorkerModel(worker_code="PC-021", worker_name="Joothi Mani", worker_phone=None)
        maragadham = models.WorkerModel(worker_code="PC-022", worker_name="Maragadham", worker_phone="9047038346")
        ramkumar_w = models.WorkerModel(worker_code="PC-023", worker_name="Ramkumar", worker_phone="7317634144")
        db.add_all([saravana_kumar, senraj, joothi_mani, maragadham, ramkumar_w])
        db.flush()

        # ── North Zone sanitary staff (Ward 04) ──
        si_dhanabalan = models.StaffModel(staff_code="SI-008", staff_name="Dhanabalan", staff_phone="9442104133", role="SI")
        ss_saravana_kumar = models.StaffModel(staff_code="SS-008", staff_name="Saravana Kumar", staff_phone="8925968025", role="SS")
        css_murali = models.StaffModel(staff_code="CSS-008", staff_name="Murali", staff_phone="8870591470", role="CSS")
        db.add_all([si_dhanabalan, ss_saravana_kumar, css_murali])
        db.flush()

        # ── North Zone workers (Ward 04) ──
        arunachalam = models.WorkerModel(worker_code="PC-024", worker_name="Arunachalam", worker_phone="9994169113")
        mani_n = models.WorkerModel(worker_code="PC-025", worker_name="Mani", worker_phone="9566412341")
        muthulakshumi = models.WorkerModel(worker_code="PC-026", worker_name="Muthulakshumi", worker_phone="9786741096")
        latha = models.WorkerModel(worker_code="PC-027", worker_name="Latha", worker_phone="8148654687")
        panneerselvam = models.WorkerModel(worker_code="PC-028", worker_name="Panneerselvam", worker_phone="9894050660")
        db.add_all([arunachalam, mani_n, muthulakshumi, latha, panneerselvam])
        db.flush()

        # Each checkpoint encodes ONLY its unique zone-scoped id (e.g. E-SCAN1).
        # All street/worker/staff data lives here and is fetched after scanning.
        def add_checkpoint(street, seq, worker, households, si, ss, css):
            db.add(models.QRCheckpointModel(
                qr_code=make_qr_id(street.zone, seq),
                zone=street.zone,
                zone_code=zone_code_for(street.zone),
                seq=seq,
                street_id=street.id,
                position=seq,
                households=households,
                worker_id=worker.id,
                si_name=si.staff_name, si_contact=si.staff_phone,
                ss_name=ss.staff_name, ss_contact=ss.staff_phone,
                css_name=css.staff_name, css_contact=css.staff_phone,
            ))

        # East Zone (E): Ward 24 → E-SCAN1..5
        add_checkpoint(sree_nagar,        1, murali,    140, si_gerard, ss_vibin, css_vengatesh)
        add_checkpoint(mageshwari_nagar,  2, yoga_raj,   30, si_gerard, ss_vibin, css_vengatesh)
        add_checkpoint(ngr_nagar,         3, priya_east,  95, si_gerard, ss_vibin, css_vengatesh)
        add_checkpoint(thiyagi_kumaran_veedhi, 4, susila,  95, si_gerard, ss_vibin, css_vengatesh)
        add_checkpoint(kalyana_sundharam, 5, aanandhan, 700, si_gerard, ss_vibin, css_vengatesh)

        # Central Zone (C): Ward 49 → C-SCAN1..5
        add_checkpoint(ponni_street,         1, surya,            530, si_loganathan, ss_muthusamy, css_yamuna)
        add_checkpoint(perameswaran_layout,  2, gopala_krishnanan, 250, si_loganathan, ss_muthusamy, css_yamuna)
        add_checkpoint(kandhasamy_layout,    3, palanisamy,        81, si_loganathan, ss_muthusamy, css_yamuna)
        add_checkpoint(lakshimi_mill_signal, 4, vadivukarasi,      43, si_loganathan, ss_muthusamy, css_yamuna)
        add_checkpoint(mariyamman_kovil,     5, udayakumar,       218, si_loganathan, ss_muthusamy, css_yamuna)

        # South Zone (S): Ward 88 → S-SCAN1..5
        add_checkpoint(palani_andavar, 1, karthick_s,  78, si_zaheer, ss_muthuraj, css_gurumoorthy)
        add_checkpoint(kgk_main_road,  2, selva_raj,   72, si_zaheer, ss_muthuraj, css_gurumoorthy)
        add_checkpoint(nagamma_nayagar, 3, sellamuthu,  56, si_zaheer, ss_muthuraj, css_gurumoorthy)
        add_checkpoint(alagachi_thottam, 4, mahendhiran, 100, si_zaheer, ss_muthuraj, css_gurumoorthy)
        add_checkpoint(muthusamy_servai, 5, sathya_s,    70, si_zaheer, ss_muthuraj, css_gurumoorthy)

        # West Zone (W): Ward 35 → W-SCAN1..5
        add_checkpoint(kk_nagar,          1, saravana_kumar,  24, si_rajendran, ss_anandh, css_balachandar)
        add_checkpoint(ranganadhan_koil,  2, senraj,          45, si_rajendran, ss_anandh, css_balachandar)
        add_checkpoint(bajana_kovil,      3, joothi_mani,     20, si_rajendran, ss_anandh, css_balachandar)
        add_checkpoint(parinagar_3_veedhi, 4, maragadham,     18, si_rajendran, ss_anandh, css_balachandar)
        add_checkpoint(ramasamy_konar,    5, ramkumar_w,       9, si_rajendran, ss_anandh, css_balachandar)

        # North Zone (N): Ward 04 → N-SCAN1..5
        add_checkpoint(madura_enclave,   1, arunachalam,    13, si_dhanabalan, ss_saravana_kumar, css_murali)
        add_checkpoint(senthura_puram,   2, mani_n,         16, si_dhanabalan, ss_saravana_kumar, css_murali)
        add_checkpoint(manachi_nagar,    3, muthulakshumi,  33, si_dhanabalan, ss_saravana_kumar, css_murali)
        add_checkpoint(visaga_garden,    4, latha,          19, si_dhanabalan, ss_saravana_kumar, css_murali)
        add_checkpoint(maruthi_avenue,   5, panneerselvam,  25, si_dhanabalan, ss_saravana_kumar, css_murali)
        db.flush()

        users = [
            models.UserModel(
                username="TN66AE6121", password_hash=hash_password("6121"), role="driver",
                full_name="Ravi Kumar", vehicle_id=auto_tipper.id,
                zone="East Zone", ward="Ward 24",
            ),
            models.UserModel(
                username="TN66AD6465", password_hash=hash_password("6465"), role="driver",
                full_name="Murugan", vehicle_id=vehicle2.id,
                zone="East Zone", ward="Ward 24",
            ),
            models.UserModel(
                username="TN66APO948", password_hash=hash_password("0948"), role="driver",
                full_name="Karthik", vehicle_id=vehicle3.id,
                zone="East Zone", ward="Ward 24",
            ),
            models.UserModel(
                username="PUSHCART241", password_hash=hash_password("0001"), role="worker",
                full_name="Murali", vehicle_id=pushcart1.id,
                zone="East Zone", ward="Ward 24",
            ),
            models.UserModel(
                username="PUSHCART242", password_hash=hash_password("0002"), role="worker",
                full_name="Yoga Raj", vehicle_id=pushcart2.id,
                zone="East Zone", ward="Ward 24",
            ),
            # Central Zone (Ward 49) logins
            models.UserModel(
                username="TN66AD8373", password_hash=hash_password("8373"), role="driver",
                full_name="Kannan", vehicle_id=central_tata1.id,
                zone="Central Zone", ward="Ward 49",
            ),
            models.UserModel(
                username="TN66AQ1114", password_hash=hash_password("1114"), role="driver",
                full_name="Baskar", vehicle_id=central_tata2.id,
                zone="Central Zone", ward="Ward 49",
            ),
            models.UserModel(
                username="TN66AQ0794", password_hash=hash_password("0794"), role="driver",
                full_name="Dinesh", vehicle_id=central_bov.id,
                zone="Central Zone", ward="Ward 49",
            ),
            models.UserModel(
                username="PUSHCART491", password_hash=hash_password("0001"), role="worker",
                full_name="Palanisamy", vehicle_id=central_pc1.id,
                zone="Central Zone", ward="Ward 49",
            ),
            models.UserModel(
                username="PUSHCART492", password_hash=hash_password("0002"), role="worker",
                full_name="Vadivukarasi", vehicle_id=central_pc2.id,
                zone="Central Zone", ward="Ward 49",
            ),
            # South Zone (Ward 88) logins
            models.UserModel(
                username="TN66AM0219", password_hash=hash_password("0219"), role="driver",
                full_name="Selvam", vehicle_id=south_tata1.id,
                zone="South Zone", ward="Ward 88",
            ),
            models.UserModel(
                username="TN66AQ1153", password_hash=hash_password("1153"), role="driver",
                full_name="Ramesh", vehicle_id=south_tata2.id,
                zone="South Zone", ward="Ward 88",
            ),
            models.UserModel(
                username="TN66P0982", password_hash=hash_password("0982"), role="driver",
                full_name="Kumar S", vehicle_id=south_bov.id,
                zone="South Zone", ward="Ward 88",
            ),
            models.UserModel(
                username="PUSHCART881", password_hash=hash_password("0001"), role="worker",
                full_name="Sellamuthu", vehicle_id=south_pc1.id,
                zone="South Zone", ward="Ward 88",
            ),
            models.UserModel(
                username="PUSHCART882", password_hash=hash_password("0002"), role="worker",
                full_name="Mahendhiran", vehicle_id=south_pc2.id,
                zone="South Zone", ward="Ward 88",
            ),
            # West Zone (Ward 35) logins
            models.UserModel(
                username="TN66AQ1287", password_hash=hash_password("1287"), role="driver",
                full_name="Santhosh", vehicle_id=west_tata1.id,
                zone="West Zone", ward="Ward 35",
            ),
            models.UserModel(
                username="TN66AC9176", password_hash=hash_password("9176"), role="driver",
                full_name="Praveen", vehicle_id=west_tata2.id,
                zone="West Zone", ward="Ward 35",
            ),
            models.UserModel(
                username="TN66AP1181", password_hash=hash_password("1181"), role="driver",
                full_name="Vignesh", vehicle_id=west_bov.id,
                zone="West Zone", ward="Ward 35",
            ),
            models.UserModel(
                username="PUSHCART351", password_hash=hash_password("0001"), role="worker",
                full_name="Joothi Mani", vehicle_id=west_pc1.id,
                zone="West Zone", ward="Ward 35",
            ),
            models.UserModel(
                username="PUSHCART352", password_hash=hash_password("0002"), role="worker",
                full_name="Maragadham", vehicle_id=west_pc2.id,
                zone="West Zone", ward="Ward 35",
            ),
            # North Zone (Ward 04) logins
            models.UserModel(
                username="TN66AC1906", password_hash=hash_password("1906"), role="driver",
                full_name="Ilango", vehicle_id=north_tata1.id,
                zone="North Zone", ward="Ward 04",
            ),
            models.UserModel(
                username="TN66AM0270", password_hash=hash_password("0270"), role="driver",
                full_name="Ganesh", vehicle_id=north_tata2.id,
                zone="North Zone", ward="Ward 04",
            ),
            models.UserModel(
                username="TN66AP0965", password_hash=hash_password("0965"), role="driver",
                full_name="Kaviya", vehicle_id=north_bov.id,
                zone="North Zone", ward="Ward 04",
            ),
            models.UserModel(
                username="PUSHCART041", password_hash=hash_password("0001"), role="worker",
                full_name="Muthulakshumi", vehicle_id=north_pc1.id,
                zone="North Zone", ward="Ward 04",
            ),
            models.UserModel(
                username="PUSHCART042", password_hash=hash_password("0002"), role="worker",
                full_name="Latha", vehicle_id=north_pc2.id,
                zone="North Zone", ward="Ward 04",
            ),
            models.UserModel(
                username="admin", password_hash=hash_password("admin123"), role="admin",
                full_name="Thiru. Katta Ravi Teja, IAS",
            ),
        ]
        db.add_all(users)
        db.commit()
        print("[SWMS] Seeded demo users, vehicles, workers, staff, streets and zone QR checkpoints.")
    except Exception as e:  # pragma: no cover
        print(f"[SWMS] Seed skipped/error: {e}")
        db.rollback()
    finally:
        db.close()


seed_demo_data()


# ---------------------------------------------------------------------------------------
# System endpoints
# ---------------------------------------------------------------------------------------


@app.get("/")
def read_root():
    db_type = "Neon PostgreSQL (Remote Cloud)" if "neon.tech" in SQLALCHEMY_DATABASE_URL else "Local SQLite Database"
    return {
        "service": "CCMC Solid Waste Management System (SWMS) FastAPI Backend",
        "database": db_type,
        "status": "online",
        "version": "2.1.0"
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check verifying database availability."""
    try:
        db.execute(text("SELECT 1"))
        db_type = "Neon PostgreSQL (Remote Cloud)" if "neon.tech" in SQLALCHEMY_DATABASE_URL else "Local SQLite Database"
        return {
            "status": "healthy",
            "database": db_type,
            "connected": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "connected": False
        }


# ---------------------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------------------


@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a field user and return a session token + automatic vehicle/worker assignment."""
    raw_user = (data.username or "").strip()
    raw_pass = (data.password or "").strip()

    if not raw_user:
        raise HTTPException(status_code=400, detail="Username or Vehicle Number is required.")

    clean_user = raw_user.upper().replace(" ", "").replace("-", "")
    # Normalize vehicle plate character O vs 0 (e.g. TN66PO982 -> TN66P0982)
    norm_user = clean_user.replace("O", "0")

    # 1. Search by exact or stripped/normalized username
    user = (
        db.query(models.UserModel)
        .filter(
            (func.upper(func.replace(func.replace(models.UserModel.username, ' ', ''), '-', '')) == clean_user) |
            (func.upper(func.replace(func.replace(func.replace(models.UserModel.username, ' ', ''), '-', ''), 'O', '0')) == norm_user)
        )
        .first()
    )

    # 2. Search by lower username or full_name
    if not user:
        user = (
            db.query(models.UserModel)
            .filter(
                (func.lower(models.UserModel.username) == raw_user.lower()) |
                (func.lower(models.UserModel.full_name) == raw_user.lower())
            )
            .first()
        )

    # 3. Handle generic pushcart login if 'PUSHCART' or 'PUSH CART' entered
    if not user and ("PUSHCART" in clean_user or "PUSHKART" in clean_user or "CART" in clean_user):
        user = (
            db.query(models.UserModel)
            .filter(models.UserModel.role == "worker")
            .first()
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail=f"Vehicle Number or User '{raw_user}' not found in SWMS database."
        )

    # Verify password (flexible for field drivers/workers)
    pw_ok = verify_password(raw_pass, user.password_hash)

    # Fallback password match rules: last 4 digits of vehicle/username, '1234', '0001', vehicle number itself, or 'admin123'
    if not pw_ok:
        last4 = clean_user[-4:] if len(clean_user) >= 4 else clean_user
        last4_norm = norm_user[-4:] if len(norm_user) >= 4 else norm_user
        valid_fallbacks = {'1234', '0001', '6121', '6465', '0948', '8373', '1114', '0794', '0219', '1153', '0982', '982', '1287', '9176', '1181', '1906', '0270', '0965', 'admin123', clean_user.lower(), norm_user.lower(), raw_user.lower(), last4.lower(), last4_norm.lower()}
        if raw_pass.lower() in valid_fallbacks:
            pw_ok = True

    if not pw_ok:
        raise HTTPException(status_code=401, detail="Invalid password for this account.")

    token = issue_token(db, user.id)
    return schemas.LoginResponse(
        token=token,
        user=build_assignment(db, user),
        message="Login successful",
    )



@app.get("/api/auth/me", response_model=schemas.LoginResponse)
def me(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    """Return the current logged-in user (used to restore a session after page refresh)."""
    token = get_bearer_token(authorization)
    user = get_current_user(db, token)
    return schemas.LoginResponse(
        token=token or "",
        user=build_assignment(db, user),
        message="Session valid",
    )


# ---------------------------------------------------------------------------------------
# Field-operation endpoints
# ---------------------------------------------------------------------------------------


@app.get("/api/swms/dashboard", response_model=schemas.DashboardResponse)
def swms_dashboard(
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Dashboard statistics + street/checkpoint coverage for the logged-in user's assigned area."""
    bearer = get_bearer_token(authorization) or token
    user = get_current_user(db, bearer)
    return get_dashboard_data(db, user)


@app.get("/api/swms/checkpoint/{qr_id}", response_model=schemas.CheckpointResolveResponse)
def resolve_checkpoint(
    qr_id: str,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Resolve a scanned QR checkpoint id (QR-001) into its street/zone/ward/area details."""
    bearer = get_bearer_token(authorization) or token
    user = get_current_user(db, bearer)

    qr = db.query(models.QRCheckpointModel).filter(
        models.QRCheckpointModel.qr_code == qr_id.strip()
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail=f"QR checkpoint '{qr_id.strip()}' was not found.")

    street = db.query(models.StreetModel).filter(models.StreetModel.id == qr.street_id).first()
    denied, reason = access_error(user, street)
    if denied:
        raise HTTPException(status_code=403, detail=reason)

    cdate = today_str()
    rec = get_checkpoint_record(db, qr, cdate)
    existing = None
    if rec:
        existing = {
            "status": rec.status,
            "remarks": rec.remarks,
            "scannedAt": rec.scanned_at.strftime("%Y-%m-%d %H:%M:%S"),
            "latitude": rec.latitude,
            "longitude": rec.longitude,
        }

    cp = to_checkpoint_schema(db, street, qr, cdate)
    return schemas.CheckpointResolveResponse(
        checkpoint=cp,
        assignment=build_assignment(db, user),
        alreadySubmitted=rec is not None,
        existingRecord=existing,
        message="Checkpoint resolved",
    )


@app.post("/api/swms/collection/submit", response_model=schemas.CollectionSubmitResponse)
def submit_collection(
    data: schemas.CollectionSubmitRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Validate and save a collection record. Blocks duplicate submissions per checkpoint per cycle."""
    bearer = get_bearer_token(authorization)
    user = get_current_user(db, bearer)

    qr_id = data.qrId.strip()
    qr = db.query(models.QRCheckpointModel).filter(
        models.QRCheckpointModel.qr_code == qr_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail=f"QR checkpoint '{qr_id}' was not found.")

    street = db.query(models.StreetModel).filter(models.StreetModel.id == qr.street_id).first()
    denied, reason = access_error(user, street)
    if denied:
        raise HTTPException(status_code=403, detail=reason)

    if data.status not in ("Collected", "Not Collected"):
        raise HTTPException(status_code=422, detail="Status must be 'Collected' or 'Not Collected'.")

    remarks = None
    if data.status == "Not Collected":
        remarks = (data.remarks or "").strip()
        if not remarks:
            raise HTTPException(
                status_code=422,
                detail="Remarks/Reason is mandatory when the collection status is 'Not Collected'.",
            )
    else:
        remarks = None  # status = Collected → remarks stays NULL

    cdate = today_str()
    existing = get_checkpoint_record(db, qr, cdate)
    if existing:
        return schemas.CollectionSubmitResponse(
            success=False,
            message="This checkpoint has already been submitted for today's collection cycle.",
            duplicate=True,
        )

    assignment = build_assignment(db, user)
    photos_json = json.dumps(data.photos) if data.photos else None
    record = models.CollectionRecordModel(
        record_no=f"CCM-{cdate.replace('-', '')}-{secrets.token_hex(4).upper()}",
        qr_code=qr_id,
        street_id=street.id,
        user_id=user.id,
        vehicle_id=assignment.vehicleId,
        worker_id=assignment.workerId,
        status=data.status,
        remarks=remarks,
        scanned_at=datetime.utcnow(),
        latitude=data.latitude,
        longitude=data.longitude,
        collection_date=cdate,
        photos=photos_json,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    response_stats = get_dashboard_data(db, user).stats
    return schemas.CollectionSubmitResponse(
        success=True,
        message="Collection status saved successfully.",
        record=to_record_volume(db, record),
        stats=response_stats,
    )


# ---------------------------------------------------------------------------------------
# Scan evidence photo upload (worker captures proof photos after every QR scan)
# ---------------------------------------------------------------------------------------


def _decode_photo_base64(data_url: str) -> bytes:
    """Accept a raw base64 string or a 'data:image/...;base64,....' URL."""
    if "," in data_url:
        prefix, _, payload = data_url.partition(",")
        if prefix.strip().startswith("data:"):
            data_url = payload
    try:
        return base64.b64decode(data_url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data. Please re-capture and try again.")


@app.post("/api/swms/photos", response_model=schemas.PhotoUploadResponse)
def upload_scan_photo(
    data: schemas.PhotoUploadRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """Authenticated upload of a worker-captured scan evidence photo (route/checkpoint)."""
    user = get_current_user(db, get_bearer_token(authorization))
    if not data.photoBase64:
        raise HTTPException(status_code=400, detail="Photo data is required.")

    img_bytes = _decode_photo_base64(data.photoBase64)
    if len(img_bytes) > 12 * 1024 * 1024:  # 12 MB safety cap
        raise HTTPException(status_code=422, detail="Photo is too large. Please re-capture.")

    ext = "png" if "png" in (data.contentType or "").lower() else "jpg"
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    fname = f"{date.today().isoformat()}_{stamp}_{secrets.token_hex(4)}_{user.id}.{ext}"

    file_path = os.path.join(PHOTO_STORAGE_DIR, fname)
    with open(file_path, "wb") as f:
        f.write(img_bytes)

    return schemas.PhotoUploadResponse(
        success=True,
        fileName=fname,
        url=f"/api/swms/photos/{fname}",
        message=f"Photo uploaded for route {data.routeId or data.qrId or '-'}.",
    )


@app.get("/api/swms/photos/{fname}")
def get_scan_photo(fname: str, authorization: Optional[str] = Header(default=None), token: Optional[str] = None, db: Session = Depends(get_db)):
    """Serve an uploaded scan evidence photo (auth required, path-traversal safe)."""
    get_current_user(db, get_bearer_token(authorization) or token)
    safe_name = os.path.basename(fname)
    file_path = os.path.join(PHOTO_STORAGE_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Photo not found.")
    return FileResponse(file_path)


# ---------------------------------------------------------------------------------------
# QR Checkpoint Management (admin) — automatic, dynamic QR image generation
# ---------------------------------------------------------------------------------------


@app.get("/api/admin/qr/zones", response_model=schemas.QRAdminListResponse)
def admin_qr_zones(
    zone: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List every zone with its generated QR ids, plus the full checkpoint inventory."""
    get_admin_user(db, get_bearer_token(authorization) or token)

    zone_names = [zone] if zone else ALL_ZONES
    zone_list: List[schemas.ZoneOptionSchema] = []
    checkpoints: List[schemas.CheckpointAdminSchema] = []

    for zone_name in zone_names:
        cps = (
            db.query(models.QRCheckpointModel)
            .filter(models.QRCheckpointModel.zone == zone_name)
            .order_by(models.QRCheckpointModel.seq.asc())
            .all()
        )
        street_count = db.query(models.StreetModel).filter(models.StreetModel.zone == zone_name).count()
        zone_list.append(schemas.ZoneOptionSchema(
            zone=zone_name,
            zoneCode=zone_code_for(zone_name),
            streets=street_count,
            checkpoints=len(cps),
            generatedQrs=[c.qr_code for c in cps],
        ))
        for c in cps:
            checkpoints.append(to_checkpoint_admin_schema(db, c))

    return schemas.QRAdminListResponse(zones=zone_list, checkpoints=checkpoints)


@app.get("/api/admin/qr/options")
def admin_qr_options(
    zone: Optional[str] = None,
    ward: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Dropdown data: streets (filtered by zone/ward), workers and SI/SS/CSS staff."""
    get_admin_user(db, get_bearer_token(authorization) or token)

    q = db.query(models.StreetModel)
    if zone:
        q = q.filter(models.StreetModel.zone == zone)
    if ward:
        q = q.filter(models.StreetModel.ward == ward)
    streets = [schemas.StreetOptionSchema(
        id=s.id, streetName=s.street_name, zone=s.zone, ward=s.ward, area=s.area,
    ) for s in q.order_by(models.StreetModel.street_name).all()]

    workers = [schemas.WorkerOptionSchema(
        id=w.id, workerCode=w.worker_code, workerName=w.worker_name, workerPhone=w.worker_phone,
    ) for w in db.query(models.WorkerModel).order_by(models.WorkerModel.worker_code).all()]

    staff_rows = db.query(models.StaffModel).order_by(models.StaffModel.role, models.StaffModel.staff_code).all()
    staff = {
        "SI": [schemas.StaffSchema(id=s.id, staffCode=s.staff_code, staffName=s.staff_name,
                                   staffPhone=s.staff_phone, role=s.role) for s in staff_rows if s.role == "SI"],
        "SS": [schemas.StaffSchema(id=s.id, staffCode=s.staff_code, staffName=s.staff_name,
                                   staffPhone=s.staff_phone, role=s.role) for s in staff_rows if s.role == "SS"],
        "CSS": [schemas.StaffSchema(id=s.id, staffCode=s.staff_code, staffName=s.staff_name,
                                    staffPhone=s.staff_phone, role=s.role) for s in staff_rows if s.role == "CSS"],
    }

    return {
        "success": True,
        "zones": [{"zone": z, "zoneCode": zone_code_for(z)} for z in ALL_ZONES],
        "streets": streets,
        "workers": workers,
        "staff": staff,
    }


@app.post("/api/admin/qr/generate/single", response_model=schemas.QRCreateResponse)
def admin_qr_generate_single(
    data: schemas.QRGenerateSingleRequest,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Create ONE checkpoint and auto-generate its QR image. No duplicate QR ids ever."""
    get_admin_user(db, get_bearer_token(authorization) or token)

    street = db.query(models.StreetModel).filter(models.StreetModel.id == data.streetId).first()
    if not street:
        raise HTTPException(status_code=404, detail="Street not found.")
    if data.zone and street.zone.lower() != data.zone.lower():
        raise HTTPException(status_code=422, detail=f"Street '{street.street_name}' belongs to {street.zone}, not {data.zone}.")

    # Build a unique, never-reused QR id for this zone
    seq = next_zone_seq(db, street.zone)
    qr_id = make_qr_id(street.zone, seq)
    while db.query(models.QRCheckpointModel).filter(models.QRCheckpointModel.qr_code == qr_id).first():
        seq += 1
        qr_id = make_qr_id(street.zone, seq)

    cp = models.QRCheckpointModel(
        qr_code=qr_id,
        zone=street.zone,
        zone_code=zone_code_for(street.zone),
        seq=seq,
        street_id=street.id,
        position=seq,
        households=data.households or 0,
        worker_id=data.workerId,
        si_name=data.siName,
        si_contact=data.siContact,
        ss_name=data.ssName,
        ss_contact=data.ssContact,
        css_name=data.cssName,
        css_contact=data.cssContact,
        status="Active",
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)

    return schemas.QRCreateResponse(
        message=f"QR checkpoint {qr_id} created and QR code generated.",
        checkpoints=[to_checkpoint_admin_schema(db, cp)],
        qrLabels=[{"qrId": qr_id, "filename": f"{qr_id}.png"}],
    )


@app.post("/api/admin/qr/generate/zone", response_model=schemas.QRCreateResponse)
def admin_qr_generate_zone(
    data: schemas.QRGenerateZoneRequest,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Generate exactly 5 QR checkpoints for a zone (E-SCAN1 .. E-SCAN5). Never duplicates."""
    get_admin_user(db, get_bearer_token(authorization) or token)

    streets = db.query(models.StreetModel).filter(models.StreetModel.zone == data.zone).order_by(models.StreetModel.street_name).all()
    if not streets:
        raise HTTPException(status_code=422, detail=f"No streets are registered for {data.zone}. Create a street first.")

    existing = set(c.qr_code for c in db.query(models.QRCheckpointModel).filter(models.QRCheckpointModel.zone == data.zone).all())
    targets = [make_qr_id(data.zone, s) for s in range(1, 6)]
    duplicates = [t for t in targets if t in existing]
    to_create = [t for t in targets if t not in existing]

    created: List[models.QRCheckpointModel] = []
    for idx, qr_id in enumerate(to_create):
        seq = int(qr_id.rsplit("-SCAN", 1)[1])
        street = streets[idx % len(streets)]
        worker = db.query(models.WorkerModel).order_by(models.WorkerModel.id).first()
        si = db.query(models.StaffModel).filter(models.StaffModel.role == "SI").order_by(models.StaffModel.id).first()
        ss = db.query(models.StaffModel).filter(models.StaffModel.role == "SS").order_by(models.StaffModel.id).first()
        css = db.query(models.StaffModel).filter(models.StaffModel.role == "CSS").order_by(models.StaffModel.id).first()
        cp = models.QRCheckpointModel(
            qr_code=qr_id,
            zone=data.zone,
            zone_code=zone_code_for(data.zone),
            seq=seq,
            street_id=street.id,
            position=seq,
            households=0,
            worker_id=worker.id if worker else None,
            si_name=si.staff_name if si else None,
            si_contact=si.staff_phone if si else None,
            ss_name=ss.staff_name if ss else None,
            ss_contact=ss.staff_phone if ss else None,
            css_name=css.staff_name if css else None,
            css_contact=css.staff_phone if css else None,
            status="Active",
        )
        db.add(cp)
        created.append(cp)

    db.commit()
    for cp in created:
        db.refresh(cp)

    total = len(created)
    msg = (
        f"Generated {total} QR code(s) for {data.zone}."
        if total
        else f"All 5 QR codes for {data.zone} already exist ({len(duplicates)} present)."
    )
    return schemas.QRCreateResponse(
        message=msg,
        checkpoints=[to_checkpoint_admin_schema(db, cp) for cp in created],
        qrLabels=[{"qrId": cp.qr_code, "filename": f"{cp.qr_code}.png"} for cp in created],
        duplicateQrs=duplicates,
    )


@app.get("/api/admin/qr/image")
def admin_qr_image(
    qrId: str,
    size: int = 14,
    download: int = 0,
    db: Session = Depends(get_db),
):
    """Dynamically render the scannable QR PNG for a checkpoint id (source of truth = DB row)."""
    cp = db.query(models.QRCheckpointModel).filter(models.QRCheckpointModel.qr_code == qrId.strip()).first()
    if not cp:
        raise HTTPException(status_code=404, detail=f"QR checkpoint '{qrId.strip()}' was not found.")
    size = max(4, min(40, size))
    png = make_qr_png(cp.qr_code, box_size=size)
    headers = {"Cache-Control": "no-store"}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{cp.qr_code}.png"'
    return Response(content=png, media_type="image/png", headers=headers)


@app.get("/api/admin/qr/download-all")
def admin_qr_download_all(
    zone: str,
    authorization: Optional[str] = Header(default=None),
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Pack all QR images for a zone into a single ZIP file (one printable PNG per checkpoint)."""
    get_admin_user(db, get_bearer_token(authorization) or token)

    cps = (
        db.query(models.QRCheckpointModel)
        .filter(models.QRCheckpointModel.zone == zone)
        .order_by(models.QRCheckpointModel.seq.asc())
        .all()
    )
    if not cps:
        raise HTTPException(status_code=404, detail=f"No QR checkpoints found for {zone}.")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for cp in cps:
            zf.writestr(f"{cp.qr_code}.png", make_qr_png(cp.qr_code, box_size=20, border=2))
        info = "\n".join(c.qr_code for c in cps)
        zf.writestr("checkpoint_ids.txt", info)

    zip_media = "application/zip"
    filename = f"SWM-QR-Codes-{zone_code_for(zone)}.zip"
    return Response(
        content=buf.getvalue(),
        media_type=zip_media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------------------
# Legacy household-record endpoints (kept for the existing command-console views)
# ---------------------------------------------------------------------------------------


@app.get("/api/swms/data", response_model=schemas.SWMSDataResponse)
def get_swms_data(db: Session = Depends(get_db)):
    """Fetch all SWMS household records & calculate live stats from Neon DB."""
    db_records = db.query(models.HouseholdRecordModel).order_by(models.HouseholdRecordModel.created_at.desc()).all()

    records_list = []
    for r in db_records:
        records_list.append(schemas.SWMSHouseholdRecordSchema(
            id=r.id,
            houseId=r.house_id,
            zone=r.zone,
            ward=r.ward,
            siName=r.si_name or "Karthik Muthusamy",
            siContact=r.si_contact or "+91 94431 10012",
            ssName=r.ss_name or "Manoj Kumar S",
            ssContact=r.ss_contact or "+91 98422 20012",
            cssName=r.css_name or "Dr. V. Arumugam",
            driverWorkerName=r.driver_worker_name or "Karthik Muthusamy",
            driverWorkerContact=r.driver_worker_contact or "+91 98765 43210",
            householderName=r.householder_name or "Resident",
            householderContact=r.householder_contact or "+91 98421 11223",
            streetName=r.street_name,
            doorNo=r.door_no,
            coverageStatus=r.coverage_status,
            notCoveredReason=r.not_covered_reason,
            remarks=r.remarks,
            submittedAt=r.submitted_at,
            latitude=r.latitude or 11.0168,
            longitude=r.longitude or 76.9558,
            locationName=r.location_name,
            gpsCoordinates=r.gps_coordinates,
            gpsAccuracy=r.gps_accuracy or 3.8,
            assignedVehicleId=r.assigned_vehicle_id or "v-push-cart",
            vehicleNo=r.vehicle_no or "TN 37 CZ 4812",
            vehicleType=r.vehicle_type or "PUSH CART"
        ))

    total = len(records_list)
    covered = sum(1 for r in records_list if r.coverageStatus == "Covered")
    not_covered = sum(1 for r in records_list if r.coverageStatus == "Not Covered")
    coverage_pct = round((covered / total) * 100) if total > 0 else 0

    zones = ["Central Zone", "East Zone", "West Zone", "North Zone", "South Zone"]
    zone_breakdown = []
    for z in zones:
        z_total = sum(1 for r in records_list if r.zone == z)
        z_covered = sum(1 for r in records_list if r.zone == z and r.coverageStatus == "Covered")
        zone_breakdown.append(schemas.ZoneBreakdownItem(
            zone=z,
            covered=z_covered,
            total=z_total
        ))

    stats = schemas.SWMSDashboardStatsSchema(
        totalHouseholds=total,
        coveredHouseholds=covered,
        notCoveredHouseholds=not_covered,
        todaysEntries=covered,
        coveragePercentage=coverage_pct,
        zoneBreakdown=zone_breakdown
    )

    return schemas.SWMSDataResponse(
        records=records_list,
        stats=stats,
        source="Neon PostgreSQL Database"
    )


@app.post("/api/swms/submit", status_code=status.HTTP_201_CREATED)
def submit_swms_record(data: schemas.SWMSHouseholdRecordSchema, db: Session = Depends(get_db)):
    """Submit or update a household record in Neon PostgreSQL Database."""
    existing = db.query(models.HouseholdRecordModel).filter(models.HouseholdRecordModel.id == data.id).first()

    if existing:
        existing.coverage_status = data.coverageStatus
        existing.not_covered_reason = data.notCoveredReason
        existing.remarks = data.remarks
        existing.submitted_at = data.submittedAt
        existing.door_no = data.doorNo
        existing.street_name = data.streetName
    else:
        new_rec = models.HouseholdRecordModel(
            id=data.id,
            house_id=data.houseId,
            zone=data.zone,
            ward=data.ward,
            si_name=data.siName,
            si_contact=data.siContact,
            ss_name=data.ssName,
            ss_contact=data.ssContact,
            css_name=data.cssName,
            driver_worker_name=data.driverWorkerName,
            driver_worker_contact=data.driverWorkerContact,
            householder_name=data.householderName,
            householder_contact=data.householderContact,
            street_name=data.streetName,
            door_no=data.doorNo,
            coverage_status=data.coverageStatus,
            not_covered_reason=data.notCoveredReason,
            remarks=data.remarks,
            submitted_at=data.submittedAt,
            latitude=data.latitude,
            longitude=data.longitude,
            location_name=data.locationName,
            gps_coordinates=data.gpsCoordinates,
            gps_accuracy=data.gpsAccuracy,
            assigned_vehicle_id=data.assignedVehicleId,
            vehicle_no=data.vehicleNo,
            vehicle_type=data.vehicleType
        )
        db.add(new_rec)

    db.commit()
    return {"message": "Record successfully saved to Neon PostgreSQL Database", "id": data.id}


@app.post("/api/swms/ai-audit")
def ai_swms_audit(db: Session = Depends(get_db)):
    """SWMS Copilot predictive audit — grounded on live Neon HouseholdRecordModel rows.

    Deterministic analytics engine (streak + recency weighted, mirrors the frontend
    historicalPredictionEngine) so the SWMS Copilot report is always based on real
    submitted field data, never on a hard-coded simulation. No external Gemini call.
    """
    household_records = (
        db.query(models.HouseholdRecordModel)
        .order_by(models.HouseholdRecordModel.created_at.desc())
        .all()
    )

    if not household_records:
        return {
            "report": (
                "No household collection records have been submitted yet.\n"
                "Ask field workers to submit door-to-door entries via the worker portal, "
                "then re-run the SWMS Copilot audit to see grounded predictive analytics."
            ),
            "error": None,
            "metrics": {"totalHouseholds": 0, "coveredHouseholds": 0, "notCoveredHouseholds": 0},
        }

    # ── Grounded KPIs from live records ────────────────────────────────────────────────
    total = len(household_records)
    covered = sum(1 for r in household_records if r.coverage_status == "Covered")
    not_covered = total - covered
    coverage_pct = round((covered / total) * 100) if total > 0 else 0

    # ── Zone breakdown ─────────────────────────────────────────────────────────────────
    zones = ["Central Zone", "East Zone", "West Zone", "North Zone", "South Zone"]
    zone_breakdown = []
    for z in zones:
        z_total = sum(1 for r in household_records if r.zone == z)
        z_covered = sum(1 for r in household_records if r.zone == z and r.coverage_status == "Covered")
        zone_breakdown.append({
            "zone": z,
            "covered": z_covered,
            "total": z_total,
            "coveragePercent": round((z_covered / z_total) * 100) if z_total else 0,
        })

    # ── Deterministic predictive scoring (mirrors frontend historicalPredictionEngine) ──
    # Group live records by house to reconstruct each house's collection history.
    by_house: dict = {}
    for rec in household_records:
        key = f"{rec.zone}|{rec.ward}|{rec.street_name}|{rec.door_no}"
        entry = by_house.setdefault(key, {
            "houseId": rec.house_id,
            "zone": rec.zone,
            "ward": rec.ward,
            "streetName": rec.street_name,
            "doorNo": rec.door_no,
            "consecutiveStreak": rec.consecutive_miss_streak if hasattr(rec, "consecutive_miss_streak") else 0,
            "recentMisses": 0,
            "recentVisits": 0,
            "olderMisses": 0,
            "olderVisits": 0,
            "lastMissedDays": 0,
            "obstacle": rec.not_covered_reason or "No obstacle recorded",
            "missReasons": [],
        })
        if rec.coverage_status == "Not Covered":
            entry["recentMisses"] += 1
            if rec.not_covered_reason:
                entry["missReasons"].append(rec.not_covered_reason)
        else:
            entry["recentVisits"] += 1

    house_list = list(by_house.values())

    # Recency-weighted risk scoring (same weights as the frontend engine)
    high_risk_households = []
    for h in house_list:
        streak_penalty = 0
        if h["consecutiveStreak"] == 1:
            streak_penalty = 35
        elif h["consecutiveStreak"] == 2:
            streak_penalty = 68
        elif h["consecutiveStreak"] == 3:
            streak_penalty = 88
        elif h["consecutiveStreak"] >= 4:
            streak_penalty = 98

        recentMissRate = (h["recentMisses"] / max(h["recentMisses"] + h["recentVisits"], 1)) * 100
        recentContribution = recentMissRate * 0.40
        streakContribution = streak_penalty * 0.35
        baselineContribution = recentMissRate * 0.15
        recurrenceContribution = (60 if h["missReasons"] else 20) * 0.10

        rawScore = recentContribution + streakContribution + baselineContribution + recurrenceContribution
        finalScore = min(96, max(15, round(rawScore)))

        riskCategory = "Low"
        if finalScore >= 75:
            riskCategory = "Critical"
        elif finalScore >= 60:
            riskCategory = "High"
        elif finalScore >= 35:
            riskCategory = "Medium"

        if riskCategory in ("Critical", "High"):
            high_risk_households.append({
                **h,
                "riskScore": finalScore,
                "riskCategory": riskCategory,
                "recentMissRatePercent": round(recentMissRate, 1),
            })

    high_risk_households.sort(key=lambda x: x["riskScore"], reverse=True)

    # ── Assemble the grounded report text ──────────────────────────────────────────────
    report_lines = []
    report_lines.append("[SWMS Copilot — Automated Predictive Audit · Grounded on Live Neon Records]")
    report_lines.append(f"• Total Households in system: {total}")
    report_lines.append(f"• Covered: {covered}  • Not Covered: {not_covered}")
    report_lines.append(f"• Overall Coverage: {coverage_pct}%")
    report_lines.append("")
    report_lines.append("Zone-wise Coverage Breakdown:")
    for z in zone_breakdown:
        report_lines.append(
            f"  - {z['zone']}: {z['covered']}/{z['total']} covered ({z['coveragePercent']}%)"
        )
    report_lines.append("")
    report_lines.append(f"Predictive High-Risk Households (streak + recency weighted): {len(high_risk_households)}")
    for h in high_risk_households[:10]:
        report_lines.append(
            f"  ⚠ {h['doorNo']}, {h['streetName']} [{h['zone']}] → risk {h['riskScore']}% "
            f"({h['riskCategory']}); obstacle: {h['obstacle']}"
        )

    report_lines.append("")
    report_lines.append("Recommended AI Actions (grounded):")
    if high_risk_households:
        report_lines.append(
            f"  • Re-route 2 extra vehicles to {high_risk_households[0]['streetName']} "
            f"({high_risk_households[0]['zone']}) — {sum(1 for h in high_risk_households if h['streetName'] == high_risk_households[0]['streetName'])} high-risk houses."
        )
    else:
        report_lines.append("  • No critical-risk houses detected — maintain current collection routing.")

    top_miss_reason = {}
    for h in house_list:
        for reason in h["missReasons"]:
            top_miss_reason[reason] = top_miss_reason.get(reason, 0) + 1
    if top_miss_reason:
        primary = max(top_miss_reason, key=top_miss_reason.get)
        report_lines.append(f"  • Primary missed-collection cause: \"{primary}\"")

    report = "\n".join(report_lines)

    return {
        "report": report,
        "error": None,
        "metrics": {
            "totalHouseholds": total,
            "coveredHouseholds": covered,
            "notCoveredHouseholds": not_covered,
            "coveragePercentage": coverage_pct,
            "highRiskHouseholds": len(high_risk_households),
            "zoneBreakdown": zone_breakdown,
        },
        "highRiskHouseholds": high_risk_households,
    }
