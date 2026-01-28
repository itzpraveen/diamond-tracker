from typing import Mapping

from fastapi import HTTPException, status


def raise_validation_error(errors: Mapping[str, str], message: str = "Validation error") -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"message": message, "errors": dict(errors)},
    )
