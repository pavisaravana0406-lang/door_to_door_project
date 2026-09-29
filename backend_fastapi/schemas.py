from pydantic import BaseModel
from typing import Optional, List


# ---------------------------------------------------------------------------------------
# Auth / Login Schemas
# ---------------------------------------------------------------------------------------


class LoginRequest(BaseModel):
    username: str
    password: str


class AssignmentSchema(BaseModel):
    userId: int
    username: str
    role: str
    fullName: Optional[str] = None
    vehicleId: Optional[int] = None
    vehicleType: Optional[str] = None
    vehicleName: Optional[str] = None
    vehicleNumber: Optional[str] = None
    workerId: Optional[int] = None
    workerName: Optional[str] = None
    workerCode: Optional[str] = None
    workerPhone: Optional[str] = None
    isPushcart: bool = False
    zone: Optional[str] = None
    ward: Optional[str] = None
    # Streets this user is authorised to scan, derived from the checkpoints
    # linked to their worker. The worker app uses this for the QR mismatch
    # check so it never has to guess from a hardcoded table.
    streetNames: List[str] = []

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    success: bool = True
    token: str
    user: AssignmentSchema
    message: Optional[str] = None


# ---------------------------------------------------------------------------------------
# QR Checkpoint / Dashboard Schemas
# ---------------------------------------------------------------------------------------


class CheckpointSchema(BaseModel):
    qrId: str
    position: int
    streetId: int
    streetName: str
    zone: str
    ward: str
    area: Optional[str] = None
    status: str = "Pending"          # "Collected" | "Not Collected" | "Pending"
    recordedAt: Optional[str] = None
    remarks: Optional[str] = None
    photos: Optional[List[str]] = []
    # Rich checkpoint details (fetched AFTER scan, not encoded in the QR)
    zoneCode: Optional[str] = None
    checkpointNumber: Optional[int] = None
    households: int = 0
    workerName: Optional[str] = None
    workerCode: Optional[str] = None
    workerContact: Optional[str] = None
    siName: Optional[str] = None
    siContact: Optional[str] = None
    ssName: Optional[str] = None
    ssContact: Optional[str] = None
    cssName: Optional[str] = None
    cssContact: Optional[str] = None

    class Config:
        from_attributes = True


class StreetDashboardSchema(BaseModel):
    streetId: int
    streetName: str
    zone: str
    ward: str
    area: Optional[str] = None
    checkpoints: List[CheckpointSchema] = []

    class Config:
        from_attributes = True


class DashboardStatsSchema(BaseModel):
    totalStreets: int = 0
    totalCheckpoints: int = 0
    collectedCheckpoints: int = 0
    notCollectedCheckpoints: int = 0
    pendingCheckpoints: int = 0
    coveragePercentage: int = 0
    status: str = "Not Covered"      # "Covered" | "Partially Covered" | "Not Covered"

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    success: bool = True
    stats: DashboardStatsSchema
    streets: List[StreetDashboardSchema] = []
    message: Optional[str] = None


class CheckpointResolveResponse(BaseModel):
    success: bool = True
    checkpoint: CheckpointSchema
    assignment: AssignmentSchema
    alreadySubmitted: bool = False
    existingRecord: Optional[dict] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------------------
# Collection Submission Schemas
# ---------------------------------------------------------------------------------------


class CollectionSubmitRequest(BaseModel):
    qrId: str
    status: str                     # "Collected" | "Not Collected"
    remarks: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: Optional[List[str]] = []


class CollectionRecordResponseSchema(BaseModel):
    id: int
    recordNo: str
    qrCode: str
    streetId: int
    streetName: Optional[str] = None
    zone: Optional[str] = None
    ward: Optional[str] = None
    area: Optional[str] = None
    userId: int
    username: Optional[str] = None
    vehicleType: Optional[str] = None
    vehicleNumber: Optional[str] = None
    workerName: Optional[str] = None
    workerCode: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    scannedAt: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    collectionDate: Optional[str] = None
    photos: Optional[List[str]] = []

    class Config:
        from_attributes = True


class CollectionSubmitResponse(BaseModel):
    success: bool = True
    message: str
    record: Optional[CollectionRecordResponseSchema] = None
    stats: Optional[DashboardStatsSchema] = None
    duplicate: bool = False


# ---------------------------------------------------------------------------------------
# QR Checkpoint Management (Admin) Schemas
# ---------------------------------------------------------------------------------------


class StaffSchema(BaseModel):
    id: int
    staffCode: str
    staffName: str
    staffPhone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class ZoneOptionSchema(BaseModel):
    zone: str
    zoneCode: str
    streets: int = 0
    checkpoints: int = 0
    generatedQrs: List[str] = []

    class Config:
        from_attributes = True


class StreetOptionSchema(BaseModel):
    id: int
    streetName: str
    zone: str
    ward: str
    area: Optional[str] = None

    class Config:
        from_attributes = True


class WorkerOptionSchema(BaseModel):
    id: int
    workerCode: str
    workerName: str
    workerPhone: Optional[str] = None

    class Config:
        from_attributes = True


class CheckpointAdminSchema(BaseModel):
    id: int
    qrId: str
    zone: str
    zoneCode: str = ""
    ward: str
    streetName: str
    area: Optional[str] = None
    checkpointNumber: int
    households: int = 0
    workerName: Optional[str] = None
    workerCode: Optional[str] = None
    workerContact: Optional[str] = None
    siName: Optional[str] = None
    siContact: Optional[str] = None
    ssName: Optional[str] = None
    ssContact: Optional[str] = None
    cssName: Optional[str] = None
    cssContact: Optional[str] = None
    status: str = "Active"
    position: int = 1
    createdAt: Optional[str] = None
    imageUrl: str = ""          # relative path to the dynamically generated QR PNG

    class Config:
        from_attributes = True


class QRGenerateSingleRequest(BaseModel):
    zone: str
    ward: str
    streetId: int
    households: int = 0
    workerId: Optional[int] = None
    siName: Optional[str] = None
    siContact: Optional[str] = None
    ssName: Optional[str] = None
    ssContact: Optional[str] = None
    cssName: Optional[str] = None
    cssContact: Optional[str] = None


class QRGenerateZoneRequest(BaseModel):
    zone: str                     # create exactly 5 checkpoints E-SCAN1 .. E-SCAN5 (no duplicates)


class QRCreateResponse(BaseModel):
    success: bool = True
    message: str
    checkpoints: List[CheckpointAdminSchema] = []
    qrLabels: List[dict] = []     # [{ qrId, filename }] for the generated images
    duplicateQrs: List[str] = []

    class Config:
        from_attributes = True


class QRAdminListResponse(BaseModel):
    success: bool = True
    zones: List[ZoneOptionSchema] = []
    checkpoints: List[CheckpointAdminSchema] = []

    class Config:
        from_attributes = True


class SWMSHouseholdRecordSchema(BaseModel):
    id: str
    houseId: str
    zone: str
    ward: str
    siName: Optional[str] = "Karthik Muthusamy"
    siContact: Optional[str] = "+91 94431 10012"
    ssName: Optional[str] = "Manoj Kumar S"
    ssContact: Optional[str] = "+91 98422 20012"
    cssName: Optional[str] = "Dr. V. Arumugam"
    driverWorkerName: Optional[str] = "Karthik Muthusamy"
    driverWorkerContact: Optional[str] = "+91 98765 43210"
    householderName: Optional[str] = "Resident"
    householderContact: Optional[str] = "+91 98421 11223"
    streetName: str
    doorNo: str
    coverageStatus: str
    notCoveredReason: Optional[str] = None
    remarks: Optional[str] = None
    submittedAt: str
    latitude: Optional[float] = 11.0168
    longitude: Optional[float] = 76.9558
    locationName: Optional[str] = None
    gpsCoordinates: Optional[str] = None
    gpsAccuracy: Optional[float] = 3.8
    assignedVehicleId: Optional[str] = "v-push-cart"
    vehicleNo: Optional[str] = "TN 37 CZ 4812"
    vehicleType: Optional[str] = "PUSH CART"

    class Config:
        from_attributes = True


class ZoneBreakdownItem(BaseModel):
    zone: str
    covered: int
    total: int


class SWMSDashboardStatsSchema(BaseModel):
    totalHouseholds: int
    coveredHouseholds: int
    notCoveredHouseholds: int
    todaysEntries: int
    coveragePercentage: int
    zoneBreakdown: List[ZoneBreakdownItem]


class SWMSDataResponse(BaseModel):
    records: List[SWMSHouseholdRecordSchema]
    stats: SWMSDashboardStatsSchema
    source: str = "Neon PostgreSQL Database"


# ---------------------------------------------------------------------------------------
# Scan Photo / Evidence Upload Schemas
# ---------------------------------------------------------------------------------------


class PhotoUploadRequest(BaseModel):
    routeId: str = ""
    qrId: str = ""
    streetName: str = ""
    vehicleNo: str = ""
    photoBase64: str
    contentType: str = "image/jpeg"


class PhotoUploadResponse(BaseModel):
    success: bool = True
    fileName: str
    url: str
    message: Optional[str] = None
