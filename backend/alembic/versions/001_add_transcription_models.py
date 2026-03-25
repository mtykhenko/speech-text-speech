"""Add transcription models

Revision ID: 001
Revises: 
Create Date: 2026-03-25 19:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create transcriptions table
    op.create_table(
        'transcriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('audio_file_path', sa.String(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('confidence', sa.String(), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transcriptions_id'), 'transcriptions', ['id'], unique=False)
    
    # Create audio_generations table
    op.create_table(
        'audio_generations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('audio_file_path', sa.String(), nullable=False),
        sa.Column('voice_id', sa.String(), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audio_generations_id'), 'audio_generations', ['id'], unique=False)
    
    # Create voice_profiles table
    op.create_table(
        'voice_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('voice_id', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_voice_profiles_id'), 'voice_profiles', ['id'], unique=False)
    
    # Create voice_samples table
    op.create_table(
        'voice_samples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('audio_file_path', sa.String(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['voice_profiles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voice_samples_id'), 'voice_samples', ['id'], unique=False)
    
    # Create model_configurations table
    op.create_table(
        'model_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_type', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('config_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_model_configurations_id'), 'model_configurations', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_model_configurations_id'), table_name='model_configurations')
    op.drop_table('model_configurations')
    op.drop_index(op.f('ix_voice_samples_id'), table_name='voice_samples')
    op.drop_table('voice_samples')
    op.drop_index(op.f('ix_voice_profiles_id'), table_name='voice_profiles')
    op.drop_table('voice_profiles')
    op.drop_index(op.f('ix_audio_generations_id'), table_name='audio_generations')
    op.drop_table('audio_generations')
    op.drop_index(op.f('ix_transcriptions_id'), table_name='transcriptions')
    op.drop_table('transcriptions')
