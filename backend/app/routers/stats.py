from fastapi import APIRouter
from ..services import stats_service

router = APIRouter(prefix='/api/stats', tags=['stats'])


@router.get('')
async def get_overview():
    data = stats_service.get_overview()
    return {'success': True, 'data': data}


@router.get('/history')
async def get_history(limit: int = 20):
    data = stats_service.get_history(limit)
    return {'success': True, 'data': data}
