Open the virtual environment:
```shell
python3 -m venv venv
source venv/bin/activate  # (Mac/Linux)
```

start the server:
```bash
uvicorn main:app --reload
```
viewables:
- Swagger UI: http://localhost:8000/docs
- Alternative ReDoc: http://localhost:8000/redoc
- OpenAPI JSON schema: http://localhost:8000/openapi.json

testing:
```bash
pytest tests/ -v
```

organization:
```
backend/
├── routes/           ← Route handlers (HTTP endpoints)
│   ├── clips.py      ← Clip CRUD operations
│   └── playback.py   ← Playback progress operations
├── models/           ← Request/Response DTOs
├── services/         ← Business logic & external services
└── main.py           ← App setup & route registration
```