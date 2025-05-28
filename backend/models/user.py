from sqlalchemy import Column, Integer, String, Boolean
from database import Base # Adjusted import path

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # You can add relationships here later if needed, e.g.:
    # items = relationship("Item", back_populates="owner") 