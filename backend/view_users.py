#!/usr/bin/env python3
"""
Script to view all registered users from the database
"""

from app.database import SessionLocal
from app.models import User

def view_users():
    """Display all registered users"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        
        if not users:
            print("\n❌ No users found in the database.\n")
            return
        
        print("\n" + "=" * 60)
        print(" " * 15 + "REGISTERED USERS")
        print("=" * 60 + "\n")
        
        for user in users:
            print(f"👤 User ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Password Hash: {user.hashed_password[:50]}...")
            print(f"   Active: {'✅ Yes' if user.is_active else '❌ No'}")
            print(f"   Created: {user.created_at}")
            print("-" * 60)
        
        print(f"\n📊 Total Users: {len(users)}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    view_users()

