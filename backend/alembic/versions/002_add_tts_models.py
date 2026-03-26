"""add tts models

Revision ID: 002
Revises: 001
Create Date: 2026-03-26 15:46:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tts_generations table
    op.create_table(
        'tts_generations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('voice_id', sa.String(), nullable=True),
        sa.Column('audio_path', sa.String(), nullable=False),
        sa.Column('audio_format', sa.String(), nullable=False),
        sa.Column('text_length', sa.Integer(), nullable=False),
        sa.Column('audio_size', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tts_generations_id'), 'tts_generations', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tts_generations_id'), table_name='tts_generations')
    op.drop_table('tts_generations')
