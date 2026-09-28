from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime, timezone
from database import Base


def _utcnow():
    """Timezone-aware UTC now."""
    return datetime.now(timezone.utc)


class HouseholdRecordModel(Base):
    """SQLAlchemy ORM Model for SWMS Door-to-Door Household Records in Neon PostgreSQL."""
    __tablename__ = "swms_household_records"

    id = Column(String, primary_key=True, index=True)
    house_id = Column(String, index=True, nullable=False)
    zone = Column(String, index=True, nullable=False)
    ward = Column(String, index=True, nullable=False)
    si_name = Column(String, nullable=True)
    si_contact = Column(String, nullable=True)
    ss_name = Column(String, nullable=True)
    ss_contact = Column(String, nullable=True)
    css_name = Column(String, nullable=True)
    driver_worker_name = Column(String, nullable=True)
    driver_worker_contact = Column(String, nullable=True)
    householder_name = Column(String, nullable=True)
    householder_contact = Column(String, nullable=True)
    street_name = Column(String, index=True, nullable=False)
    door_no = Column(String, nullable=False)
    coverage_status = Column(String, index=True, nullable=False)
    not_covered_reason = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    submitted_at = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    gps_coordinates = Column(String, nullable=True)
    gps_accuracy = Column(Float, nullable=True)

    assigned_vehicle_id = Column(String, nullable=True)
    vehicle_no = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)


class VehicleAssignmentModel(Base):
    """SQLAlchemy ORM Model for Vehicle & Area Assignments in Neon PostgreSQL."""
    __tablename__ = "swms_vehicle_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    area_id = Column(String, index=True, nullable=False)
    area_name = Column(String, nullable=False)
    vehicle_id = Column(String, index=True, nullable=False)
    vehicle_name = Column(String, nullable=False)
    ward = Column(String, nullable=True)
    zone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


# ---------------------------------------------------------------------------------------
# SWMS Field Collection System — Role-based Assignment Models
# ---------------------------------------------------------------------------------------


class VehicleModel(Base):
    """Registered municipal collection vehicle (Auto Tipper, Compactor, Pushcart, ...)."""
    __tablename__ = "swms_vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_type = Column(String, nullable=False, index=True)     # e.g. "Auto Tipper", "Compactor", "Pushcart"
    vehicle_number = Column(String, nullable=True)                # NULL for Pushcart
    vehicle_name = Column(String, nullable=True)                  # optional friendly name
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class WorkerModel(Base):
    """Field sanitary worker (mainly used for pushcart assignments)."""
    __tablename__ = "swms_workers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worker_code = Column(String, unique=True, index=True, nullable=False)   # e.g. "PC-001"
    worker_name = Column(String, nullable=False)                            # e.g. "Kumar"
    worker_phone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class UserModel(Base):
    """SWMS login account linked to a vehicle (drivers) and/or a worker (pushcart)."""
    __tablename__ = "swms_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)                 # bcrypt hash — never plain text
    role = Column(String, nullable=False, default="driver")        # "driver" | "worker" | "admin"
    full_name = Column(String, nullable=True)
    vehicle_id = Column(Integer, ForeignKey("swms_vehicles.id"), nullable=True)
    worker_id = Column(Integer, ForeignKey("swms_workers.id"), nullable=True)
    zone = Column(String, nullable=True)                            # assigned zone restriction
    ward = Column(String, nullable=True)                            # assigned ward restriction
    created_at = Column(DateTime, default=_utcnow)


class StreetModel(Base):
    """Municipal street that hosts QR checkpoints."""
    __tablename__ = "swms_streets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    street_name = Column(String, nullable=False, index=True)
    zone = Column(String, nullable=False, index=True)
    ward = Column(String, nullable=False, index=True)
    area = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


class StaffModel(Base):
    """Sanitary staff (SI / SS / CSS) that can be assigned to a QR checkpoint."""
    __tablename__ = "swms_staff"

    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_code = Column(String, unique=True, index=True, nullable=False)   # e.g. "SI-001"
    staff_name = Column(String, nullable=False)
    staff_phone = Column(String, nullable=True)
    role = Column(String, nullable=False, index=True)                      # "SI" | "SS" | "CSS"
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class QRCheckpointModel(Base):
    """A unique QR checkpoint belonging to a street. QR code payload = qr_code only.

    The QR id is zone-scoped and human friendly, e.g. E-SCAN1.
    All street/worker/SS/CSS/SI data stays in the database and is only fetched AFTER scanning.
    """
    __tablename__ = "swms_qr_checkpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    qr_code = Column(String, unique=True, index=True, nullable=False)   # e.g. "E-SCAN1" (the actual QR payload)
    zone = Column(String, nullable=False, index=True)                   # denormalized zone name, e.g. "East Zone"
    zone_code = Column(String, nullable=True, index=True)               # e.g. "Z1", used for the QR prefix
    seq = Column(Integer, nullable=False, default=1)                    # 01..05 checkpoint number within the zone
    street_id = Column(Integer, ForeignKey("swms_streets.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=1)
    households = Column(Integer, nullable=False, default=0)             # household count at this checkpoint
    worker_id = Column(Integer, ForeignKey("swms_workers.id"), nullable=True)
    si_name = Column(String, nullable=True)
    si_contact = Column(String, nullable=True)
    ss_name = Column(String, nullable=True)
    ss_contact = Column(String, nullable=True)
    css_name = Column(String, nullable=True)
    css_contact = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Active")           # "Active" | "Inactive"
    created_at = Column(DateTime, default=_utcnow)


class CollectionRecordModel(Base):
    """One collection submission per QR checkpoint per collection cycle (day)."""
    __tablename__ = "swms_collection_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    record_no = Column(String, unique=True, index=True, nullable=False)
    qr_code = Column(String, index=True, nullable=False)
    street_id = Column(Integer, ForeignKey("swms_streets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("swms_users.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("swms_vehicles.id"), nullable=True)
    worker_id = Column(Integer, ForeignKey("swms_workers.id"), nullable=True)
    status = Column(String, nullable=False, index=True)          # "Collected" | "Not Collected"
    remarks = Column(Text, nullable=True)                        # NULL for Collected
    scanned_at = Column(DateTime, nullable=False, default=_utcnow)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    collection_date = Column(String, nullable=False, index=True)  # "YYYY-MM-DD" cycle key
    photos = Column(Text, nullable=True)  # JSON-encoded array of scan proof photos


class AuthTokenModel(Base):
    """Bearer session tokens issued at login (only a hash is stored)."""
    __tablename__ = "swms_auth_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("swms_users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=_utcnow)