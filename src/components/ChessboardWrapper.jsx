import React from 'react';
import Chessboard from 'chessboardjsx';

const ChessboardWrapper = ({ position, onPieceDrop, orientation = 'white', arePiecesDraggable = true }) => {
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Chessboard
                width={320}
                position={position}
                onDrop={({ sourceSquare, targetSquare }) => {
                    onPieceDrop(sourceSquare, targetSquare);
                }}
                orientation={orientation}
                draggable={arePiecesDraggable}
                dropSquareStyle={{ boxShadow: 'inset 0 0 1px 4px rgba(255, 255, 255, 0.5)' }}
                boardStyle={{
                    borderRadius: '5px',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
                }}
            />
        </div>
    );
};

export default ChessboardWrapper;
