import { useCallback, useMemo, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useWindowSize } from './useWindowSize';
import problems from './boulders/V3.json'
import type { MoonboardProblem } from './boulders/MoonboardProblem';
import _ from 'lodash';

const FootRuleBadge = {
    AnyMarkHolds: {
        label: "Any marked holds",
        className: "bg-success"
    },
    Footless: {
        label: "Footless",
        className: "bg-info"
    },
    FootlessAndKickboard: {
        label: "Footless + Kickboard",
        className: "bg-warning"
    },
    NoKickboard: {
        label: "No kickboard",
        className: "bg-danger"
    }
} as any

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
    const [textFilter, setTextFilter] = useState<string>("");

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
                },
                problemPanel: {
                    left: 0,
                    top: renderedHeight - 25,
                    width: windowWidth,
                    height: 25
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
            },
            problemPanel: {
                left: 0,
                top: windowHeight - 25,
                width: renderedWidth,
                height: 25
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

    const filteredProblems = useMemo(() => {
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
            .filter(x => textFilter == ""
                || x.Name.toLowerCase().includes(textFilter.toLowerCase())
                || x.SetterName.toLowerCase().includes(textFilter.toLowerCase()))
            .orderBy([
                x => x.Score,
                x => x.Name
            ],
                ["desc", "asc"])
            .value()
    }, [problems, selectedHolds, textFilter])

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

    const easeOutSine = (x: number) => {
        return Math.sin((x * Math.PI) / 2);
    }

    const onTextFilterChanged = useCallback(_.debounce((text: string) => setTextFilter(text), 250), []);

    return (
        <div>
            <div className="vh-100">
                <img
                    src="Moonboard.png"
                    className="w-100 h-100"
                    style={{
                        objectFit: "contain",
                        objectPosition: "top left",
                        userSelect: "none"
                    }} />
            </div>

            {_.range(boardSize[1]).map(y =>
                <div key={y}>
                    {_.range(boardSize[0]).map(x => {
                        const hold = posToHold(x, boardSize[1] - 1 - y);

                        return <div
                            key={x}
                            className="position-absolute"
                            onClick={() => selectedProblem == null && toggleHold(hold)}
                            role={selectedProblem == null ? "button" : undefined}
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
                                        : `hsl(10 100% 50% / ${50 * easeOutSine(scorePerHolds[hold] / Math.max(1, maxScore))}%)`
                            }}
                        />
                    }
                    )}
                </div>
            )}

            <div
                className="position-absolute bg-black"
                style={{
                    ...board.infoPanel,
                    overflowY: "auto",
                    overflowX: "hidden"
                }}
            >
                <div className="sticky-top bg-white">
                    <div className="row">
                        <button
                            className="btn btn-warning rounded-0 col border-dark fw-semibold"
                            onClick={() => setSelectedProblem(problems[Math.floor(Math.random() * problems.length)])}
                        >
                            Random
                        </button>
                        <button
                            className="btn btn-secondary rounded-0 col border-dark fw-semibold"
                            disabled={selectedProblem != null || selectedHolds.length == 0}
                            onClick={() => setSelectedHolds([])}
                        >
                            Clear holds
                        </button>
                    </div>


                    <input
                        type="text"
                        className="form-input w-100"
                        placeholder="Search"
                        onChange={e => onTextFilterChanged(e.target.value)}
                        defaultValue=""
                    />
                </div>

                {filteredProblems
                    .map(x =>
                        <div
                            key={x.ImagePath}
                            onClick={() => setSelectedProblem(selectedProblem == x ? null : x)}
                            className={"p-1 border border-light fw-light " + (x == selectedProblem ? "bg-warning text-dark" : "bg-dark text-light")}
                            role="button"
                        >
                            {x.Name} - {x.SetterName}
                            <span className="badge bg-secondary ms-2">{(x.Score * 100).toFixed(0)}%</span>
                            {/*<span className={"badge " + FootRuleBadge[x.FootRules].className}>{FootRuleBadge[x.FootRules].label}</span>*/}
                        </div>)
                }
            </div>

            <div className="bg-warning text-dark position-absolute text-center" style={board.problemPanel} role="button">
                {selectedProblem != null &&
                    <h6 className="mt-1 fw-bold" onClick={() => setSelectedProblem(null)} >
                        {selectedProblem.Name} - {selectedProblem.SetterName}
                    </h6>
                }
            </div>

        </div>
    );
}

export default App;