import React from 'react';
import Chessboard from 'chessboardjsx';

// We wrap it to handle responsive sizing or custom styling eventually
export default function ChessboardWrapper({ position, onPieceDrop, orientation = 'white', arePiecesDraggable = true, squareStyles = {} }) {
    return (
        <div style={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '2px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
        }}>
            <Chessboard
                position={position}
                onDrop={({ sourceSquare, targetSquare }) =>
                    onPieceDrop(sourceSquare, targetSquare)
                }
                orientation={orientation}
                width={380} // Ideally dynamic, but fixed for now to fit mobile width comfortably
                draggable={arePiecesDraggable}
                dropSquareStyle={{ boxShadow: 'inset 0 0 1px 4px var(--accent-primary)' }}
                boardStyle={{
                    borderRadius: '2px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
                darkSquareStyle={{ backgroundColor: '#b58863' }} // Classic Wood
                lightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                squareStyles={squareStyles}
            />
        </div>
    );
}
