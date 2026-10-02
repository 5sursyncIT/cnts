from fastapi import APIRouter, Depends

from app.api.deps import require_admin, require_module, require_staff
from app.api.routes.analyses import router as analyses_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin_auth import router as admin_auth_router
from app.api.routes.commandes import router as commandes_router
from app.api.routes.crossmatch import router as crossmatch_router
from app.api.routes.donneurs import router as donneurs_router
from app.api.routes.dons import router as dons_router
from app.api.routes.health import router as health_router
from app.api.routes.hemovigilance import router as hemovigilance_router
from app.api.routes.hopitaux import router as hopitaux_router
from app.api.routes.liberation import router as liberation_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.poches import router as poches_router
from app.api.routes.receveurs import router as receveurs_router
from app.api.routes.sync import router as sync_router
from app.api.routes.stock import router as stock_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.tableau_de_bord import router as tableau_de_bord_router
from app.api.routes.trace import router as trace_router
from app.api.routes.contact import router as contact_router
from app.api.routes.content import router as content_router
from app.api.routes.faq import router as faq_router
from app.api.routes.team import router as team_router
from app.api.routes.partners import router as partners_router
from app.api.routes.patient import router as patient_router
from app.api.routes.parametrage import router as parametrage_router
from app.api.routes.etiquetage import router as etiquetage_router
from app.api.routes.monitoring import router as monitoring_router
from app.api.routes.upload import router as upload_router
from app.api.routes.users import router as users_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.rendez_vous import router as rendez_vous_router
from app.api.routes.sites import router as sites_router
from app.api.routes.phenotypage import router as phenotypage_router
from app.api.routes.rai import router as rai_router
from app.api.routes.nat import router as nat_router
from app.api.routes.reactions_donneur import router as reactions_donneur_router
from app.api.routes.culm import router as culm_router
from app.api.routes.suivi_transfusion import router as suivi_transfusion_router
from app.api.routes.eir import router as eir_router
from app.api.routes.apherese import router as apherese_router
from app.api.routes.collectes import router as collectes_router
from app.api.routes.prevision import router as prevision_router
from app.api.routes.transport import router as transport_router
from app.api.routes.qualite import router as qualite_router
from app.api.routes.equipements import router as equipements_router
from app.api.routes.formations import router as formations_router
from app.api.routes.automates import router as automates_router
from app.api.routes.fhir import router as fhir_router
from app.api.routes.dhis2 import router as dhis2_router
from app.api.routes.facturation import router as facturation_router
from app.api.routes.consommables import router as consommables_router
from app.api.routes.fidelisation import router as fidelisation_router


# Toute route métier exige un compte du personnel (Bearer ou cookie
# ``cnts_access``) ; la gestion des comptes exige un administrateur. Seuls
# restent publics : santé, authentification, contenus du portail (lecture —
# leurs écritures ont leur propre contrôle), espace patient (auth propre) et
# les routes publiques des collectes (calendrier, inscription).
STAFF = [Depends(require_staff)]
ADMIN = [Depends(require_admin)]
DONNEURS = [Depends(require_module("donneurs"))]
DONS = [Depends(require_module("dons"))]
LABORATOIRE = [Depends(require_module("laboratoire"))]
STOCK = [Depends(require_module("stock"))]
DISTRIBUTION = [Depends(require_module("distribution"))]
HEMOVIGILANCE = [Depends(require_module("hemovigilance"))]
ANALYTICS = [Depends(require_module("analytics"))]

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(admin_auth_router, tags=["admin-auth"])
api_router.include_router(donneurs_router, tags=["donneurs"], dependencies=DONNEURS)
api_router.include_router(dons_router, tags=["dons"], dependencies=DONS)
api_router.include_router(analyses_router, tags=["analyses"], dependencies=LABORATOIRE)
api_router.include_router(liberation_router, tags=["liberation"], dependencies=LABORATOIRE)
api_router.include_router(poches_router, tags=["poches"], dependencies=STOCK)
api_router.include_router(stock_router, tags=["stock"], dependencies=STOCK)
api_router.include_router(hopitaux_router, tags=["hopitaux"], dependencies=DISTRIBUTION)
api_router.include_router(commandes_router, tags=["commandes"], dependencies=DISTRIBUTION)
api_router.include_router(receveurs_router, tags=["receveurs"], dependencies=DISTRIBUTION)
api_router.include_router(crossmatch_router, tags=["cross-match"], dependencies=DISTRIBUTION)
api_router.include_router(hemovigilance_router, tags=["hemovigilance"], dependencies=HEMOVIGILANCE)
api_router.include_router(analytics_router, tags=["analytics"], dependencies=ANALYTICS)
api_router.include_router(tableau_de_bord_router, tags=["tableau-de-bord"], dependencies=STAFF)
api_router.include_router(trace_router, tags=["trace"], dependencies=ADMIN)
api_router.include_router(metrics_router, tags=["metrics"])
api_router.include_router(sync_router, tags=["sync"], dependencies=STAFF)
api_router.include_router(content_router, tags=["content"])
api_router.include_router(contact_router, tags=["contact"])
api_router.include_router(faq_router, tags=["content"])
api_router.include_router(team_router, tags=["content"])
api_router.include_router(partners_router, tags=["content"])
api_router.include_router(patient_router, tags=["patient"])
api_router.include_router(rendez_vous_router, tags=["rendez-vous"], dependencies=DONNEURS)
api_router.include_router(parametrage_router, prefix="/parametrage", tags=["parametrage"], dependencies=ADMIN)
api_router.include_router(etiquetage_router, prefix="/etiquetage", tags=["etiquetage"], dependencies=LABORATOIRE)
api_router.include_router(monitoring_router, prefix="/observability", tags=["observability"], dependencies=ADMIN)
api_router.include_router(upload_router, tags=["upload"], dependencies=STAFF)
api_router.include_router(users_router, tags=["users"], dependencies=ADMIN)
api_router.include_router(notifications_router, tags=["notifications"], dependencies=STAFF)
# Sites : lecture + transferts pour le module stock ; création/modification de
# site réservées à l'admin (dépendance posée sur ces routes).
api_router.include_router(sites_router, tags=["sites"], dependencies=STOCK)
api_router.include_router(phenotypage_router, tags=["phenotypage"], dependencies=LABORATOIRE)
api_router.include_router(rai_router, tags=["rai"], dependencies=LABORATOIRE)
api_router.include_router(nat_router, tags=["nat"], dependencies=LABORATOIRE)
api_router.include_router(reactions_donneur_router, tags=["reactions-donneur"], dependencies=LABORATOIRE)
api_router.include_router(culm_router, tags=["culm"], dependencies=LABORATOIRE)
api_router.include_router(suivi_transfusion_router, tags=["suivi-transfusion"], dependencies=LABORATOIRE)
api_router.include_router(eir_router, tags=["eir"], dependencies=HEMOVIGILANCE)
api_router.include_router(apherese_router, tags=["apherese"], dependencies=LABORATOIRE)
api_router.include_router(collectes_router, tags=["collectes"])
api_router.include_router(prevision_router, tags=["prevision"], dependencies=ANALYTICS)
api_router.include_router(transport_router, tags=["transport"], dependencies=DISTRIBUTION)
api_router.include_router(qualite_router, prefix="/qualite", tags=["qualite"], dependencies=ADMIN)
api_router.include_router(equipements_router, tags=["equipements"], dependencies=ADMIN)
api_router.include_router(formations_router, tags=["formations"], dependencies=ADMIN)
api_router.include_router(automates_router, tags=["automates"], dependencies=LABORATOIRE)
api_router.include_router(fhir_router, tags=["fhir"], dependencies=ADMIN)
api_router.include_router(dhis2_router, tags=["dhis2"], dependencies=ADMIN)
api_router.include_router(facturation_router, prefix="/facturation", tags=["facturation"], dependencies=ADMIN)
api_router.include_router(consommables_router, tags=["consommables"], dependencies=STOCK)
api_router.include_router(fidelisation_router, tags=["fidelisation"], dependencies=DONNEURS)
