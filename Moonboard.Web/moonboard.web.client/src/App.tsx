import { useEffect, useMemo, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useWindowSize } from './useWindowSize';
import problems from './boulders/V3.json'
import type { MoonboardProblem } from './boulders/MoonboardProblem';
import _ from 'lodash';

const App = () => {
    const windowSize = useWindowSize();
    const imageSize = [1399, 1500]
    const boardOffsets = {
        left: 0.105,
        top: 0.085,
        right: 0.05,
        bottom: 0.07
    }
    const boardSize = [11, 12];

    const [selectedHolds, setSelectedHolds] = useState<string[]>([]);
    const [selectedProblem, setSelectedProblem] = useState<MoonboardProblem | null>(null);

    const board = useMemo(() => {
        const [imageWidth, imageHeight] = imageSize;
        const [windowWidth, windowHeight] = windowSize;

        const imageRatio = imageWidth / imageHeight;
        const windowRatio = windowWidth / windowHeight;

        if (windowRatio < imageRatio) {
            // Window is relatively taller/narrower → width is constrained
            const renderedHeight = windowWidth / imageRatio;

            return {
                left: windowWidth * boardOffsets.left,
                top: renderedHeight * boardOffsets.top,
                cellSize: (windowWidth * (1 - boardOffsets.left - boardOffsets.right)) / boardSize[0],
                infoPanel: {
                    width: windowWidth,
                    height: windowHeight - renderedHeight,
                    left: 0,
                    top: renderedHeight
                }
            }
        }

        // Height is constrained
        const renderedWidth = windowHeight * imageRatio;

        return {
            left: renderedWidth * boardOffsets.left,
            top: windowHeight * boardOffsets.top,
            cellSize: (renderedWidth * (1 - boardOffsets.top - boardOffsets.bottom)) / boardSize[0],
            infoPanel: {
                width: windowWidth - renderedWidth,
                height: windowHeight,
                left: renderedWidth,
                top: 0,
            }
        }

    }, [windowSize, imageSize]);

    const posToHold = (x: number, y: number) => {
        const column = String.fromCharCode("A".charCodeAt(0) + x);

        return `${column}${y + 1}`;
    }

    const scorePerHolds = useMemo(() => {
        const scorePerHold: Record<string, number> = {};

        for (let x = 0; x < boardSize[0]; x++) {
            for (let y = 0; y < boardSize[1]; y++) {
                scorePerHold[posToHold(x, y)] = 0;
            }
        }

        for (let problem of problems) {
            const problemHolds = [
                ...problem.StartHolds,
                ...problem.IntermediateHolds,
                ...problem.FinishHolds
            ]

            const holdsMatch = selectedHolds
                .every(hold => problemHolds.includes(hold));

            if (holdsMatch) {
                for (let problemHold of problemHolds) {
                    scorePerHold[problemHold]++
                }
            }
        }

        return scorePerHold;
    }, [selectedHolds])

    const maxScore = useMemo(() => {
        return _(Object.keys(scorePerHolds))
            .filter(x => !selectedHolds.includes(x))
            .map(x => scorePerHolds[x])
            .max()!;
    }, [scorePerHolds])

    const scoredProblems = useMemo(() => {
        return _(problems)
            .map(problem => {
                const problemHolds = [
                    ...problem.StartHolds,
                    ...problem.IntermediateHolds,
                    ...problem.FinishHolds
                ]

                const intersection = problemHolds
                    .filter(hold => selectedHolds.includes(hold))
                    .length;

                const union = new Set([
                    ...problemHolds,
                    ...selectedHolds
                ]).size;

                return {
                    ...problem,
                    Score: union > 0 ? intersection / union : 0
                };
            })
            .orderBy([
                x => x.Score,
                x => x.Name
            ],
                ["desc", "asc"])
            .value()
    }, [problems, selectedHolds])

    const toggleHold = (hold: string) => {
        if (selectedHolds.includes(hold)) {
            setSelectedHolds(selectedHolds.filter(x => x != hold))
        }
        else {
            setSelectedHolds([
                ...selectedHolds,
                hold
            ])
        }
    }

    return (
        <div>
            <div className="vh-100">
                <img
                    src="Moonboard.png"
                    className="w-100 h-100"
                    style={{
                        objectFit: "contain",
                        objectPosition: "top left"
                    }} />

            </div>

            {_.range(boardSize[1]).map(y =>
                <div key={y}>
                    {_.range(boardSize[0]).map(x => {
                        const hold = posToHold(x, boardSize[1] - 1 - y);

                        return <div
                            key={x}
                            className="position-absolute"
                            onClick={() => toggleHold(hold)}
                            style={{
                                width: board.cellSize,
                                height: board.cellSize,
                                left: board.left + x * board.cellSize,
                                top: board.top + y * board.cellSize,
                                backgroundColor: selectedProblem != null
                                    ? selectedProblem.StartHolds.includes(hold)
                                        ? "#00FF0088"
                                        : selectedProblem.IntermediateHolds.includes(hold)
                                            ? "#0000FF88"
                                            : selectedProblem.FinishHolds.includes(hold)
                                                ? "#FF000088"
                                                : "#00000000"
                                    : selectedHolds.includes(hold)
                                        ? "#00FF0088"
                                        : `hsl(0 ${100 * scorePerHolds[hold] / Math.max(1, maxScore)}% 50% / 50%)`
                            }}
                        />
                    }
                    )}
                </div>
            )}

            <div
                className="position-absolute"
                style={{
                    ...board.infoPanel,
                    overflow: "auto"
                }}
            >
                {scoredProblems
                    .map(x =>
                        <div
                            key={x.ImagePath}
                            onClick={() => setSelectedProblem(selectedProblem == x ? null : x)}
                            className={x == selectedProblem ? "bg-danger" : ""}
                        >
                            {x.Name} ({x.Score * 100}%)
                        </div>)
                }
            </div>
        </div>
    );
}

export default App;