"""File handling utilities."""

import os
from typing import Optional, List
from pathlib import Path
from fastapi import UploadFile


def validate_audio_file(
    file: UploadFile,
    max_size: int = 25 * 1024 * 1024,  # 25 MB default
    allowed_formats: Optional[List[str]] = None
) -> Optional[str]:
    """
    Validate an uploaded audio file.
    
    Args:
        file: Uploaded file object
        max_size: Maximum file size in bytes
        allowed_formats: List of allowed file extensions (e.g., ['mp3', 'wav'])
    
    Returns:
        Error message if validation fails, None if valid
    """
    if allowed_formats is None:
        allowed_formats = ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm', 'mp4', 'mpeg', 'mpga']
    
    # Check if file exists
    if not file:
        return "No file provided"
    
    # Check filename
    if not file.filename:
        return "File has no filename"
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower().lstrip('.')
    if file_ext not in allowed_formats:
        return f"Unsupported file format. Allowed formats: {', '.join(allowed_formats)}"
    
    # Check file size (if available)
    if hasattr(file, 'size') and file.size:
        if file.size > max_size:
            max_mb = max_size / (1024 * 1024)
            return f"File too large. Maximum size: {max_mb:.1f} MB"
    
    # Check content type (if available)
    if file.content_type:
        valid_content_types = [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/flac',
            'audio/x-flac',
            'audio/mp4',
            'audio/m4a',
            'audio/ogg',
            'audio/webm',
            'video/mp4',  # Some audio files have video MIME type
            'application/octet-stream'  # Generic binary
        ]
        
        if not any(ct in file.content_type for ct in valid_content_types):
            # Don't fail on content type alone, just warn
            print(f"Warning: Unexpected content type: {file.content_type}")
    
    return None


def save_uploaded_file(
    file_content: bytes,
    filename: str,
    storage_path: Path
) -> Path:
    """
    Save uploaded file to storage.
    
    Args:
        file_content: File content bytes
        filename: Original filename
        storage_path: Directory to save file
    
    Returns:
        Path to saved file
    """
    storage_path.mkdir(parents=True, exist_ok=True)
    
    file_path = storage_path / filename
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    return file_path


def get_file_size(file_path: Path) -> int:
    """
    Get file size in bytes.
    
    Args:
        file_path: Path to file
    
    Returns:
        File size in bytes
    """
    return file_path.stat().st_size if file_path.exists() else 0


def delete_file(file_path: Path) -> bool:
    """
    Delete a file if it exists.
    
    Args:
        file_path: Path to file
    
    Returns:
        True if deleted, False if file didn't exist
    """
    if file_path.exists():
        file_path.unlink()
        return True
    return False


def ensure_directory(directory: Path) -> Path:
    """
    Ensure directory exists, create if it doesn't.
    
    Args:
        directory: Directory path
    
    Returns:
        Directory path
    """
    directory.mkdir(parents=True, exist_ok=True)
    return directory
