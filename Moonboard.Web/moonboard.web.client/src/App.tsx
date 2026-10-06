import React, { useCallback, useMemo, useState } from 'react';
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

const arrowDownIcon = <svg className="icon me-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M278.6 438.6L182.6 534.6C170.1 547.1 149.8 547.1 137.3 534.6L41.3 438.6C28.8 426.1 28.8 405.8 41.3 393.3C53.8 380.8 74.1 380.8 86.6 393.3L128 434.7L128 128C128 110.3 142.3 96 160 96C177.7 96 192 110.3 192 128L192 434.7L233.4 393.3C245.9 380.8 266.2 380.8 278.7 393.3C291.2 405.8 291.2 426.1 278.7 438.6zM352 544C334.3 544 320 529.7 320 512C320 494.3 334.3 480 352 480L384 480C401.7 480 416 494.3 416 512C416 529.7 401.7 544 384 544L352 544zM352 416C334.3 416 320 401.7 320 384C320 366.3 334.3 352 352 352L448 352C465.7 352 480 366.3 480 384C480 401.7 465.7 416 448 416L352 416zM352 288C334.3 288 320 273.7 320 256C320 238.3 334.3 224 352 224L512 224C529.7 224 544 238.3 544 256C544 273.7 529.7 288 512 288L352 288zM352 160C334.3 160 320 145.7 320 128C320 110.3 334.3 96 352 96L576 96C593.7 96 608 110.3 608 128C608 145.7 593.7 160 576 160L352 160z" /></svg>;
const arrowUpIcon = <svg className="icon me-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M352 96C334.3 96 320 110.3 320 128C320 145.7 334.3 160 352 160L384 160C401.7 160 416 145.7 416 128C416 110.3 401.7 96 384 96L352 96zM352 224C334.3 224 320 238.3 320 256C320 273.7 334.3 288 352 288L448 288C465.7 288 480 273.7 480 256C480 238.3 465.7 224 448 224L352 224zM352 352C334.3 352 320 366.3 320 384C320 401.7 334.3 416 352 416L512 416C529.7 416 544 401.7 544 384C544 366.3 529.7 352 512 352L352 352zM352 480C334.3 480 320 494.3 320 512C320 529.7 334.3 544 352 544L576 544C593.7 544 608 529.7 608 512C608 494.3 593.7 480 576 480L352 480zM182.6 105.4C170.1 92.9 149.8 92.9 137.3 105.4L41.3 201.4C28.8 213.9 28.8 234.2 41.3 246.7C53.8 259.2 74.1 259.2 86.6 246.7L128 205.3L128 512C128 529.7 142.3 544 160 544C177.7 544 192 529.7 192 512L192 205.3L233.4 246.7C245.9 259.2 266.2 259.2 278.7 246.7C291.2 234.2 291.2 213.9 278.7 201.4L182.7 105.4z" /></svg>;


const posToHold = (x: number, y: number) => {
    const column = String.fromCharCode("A".charCodeAt(0) + x);

    return `${column}${y + 1}`;
}

interface Pos {
    x: number;
    y: number;
}

const holdToPos = (hold: string) => ({
    x: hold.charCodeAt(0) - "A".charCodeAt(0),
    y: parseInt(hold.substring(1), 10) - 1
});

interface SortOption {
    label: string;
    ascending: boolean;
    accessor(x: MoonboardProblem): string | number;
}

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

    const problemsDifficulty = useMemo(() => {
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

            for (let problemHold of problemHolds) {
                scorePerHold[problemHold]++
            }
        }

        const getMinDistance = (problem: MoonboardProblem) => {
            const startHolds = problem.StartHolds
                .map(holdToPos);

            const nodes = problem.IntermediateHolds
                .map(holdToPos);

            const finishHolds = problem.FinishHolds
                .map(holdToPos);

            const distance = (a: Pos, b: Pos) => {
                const dx = a.x - b.x;
                const dy = a.y - b.y;

                return dx * dx + dy * dy;
            }

            const getShortestPath = (start: Pos, end: Pos) => {
                const allNodes = [start, ...nodes, end];

                const distances = new Map<Pos, number>();
                const visited = new Set<Pos>();

                for (const node of allNodes) {
                    distances.set(node, Infinity);
                }

                distances.set(start, 0);

                while (visited.size < allNodes.length) {
                    // Find unvisited node with smallest distance
                    let current: Pos | undefined;
                    let currentDistance = Infinity;

                    for (const node of allNodes) {
                        if (!visited.has(node) && distances.get(node)! < currentDistance) {
                            current = node;
                            currentDistance = distances.get(node)!;
                        }
                    }

                    if (!current) {
                        return Infinity;
                    }

                    if (current === end) {
                        return currentDistance;
                    }

                    visited.add(current);

                    // Assuming every node can connect to every other node
                    for (const next of allNodes) {
                        if (visited.has(next)) {
                            continue;
                        }

                        const newDistance = currentDistance + distance(current, next);

                        if (newDistance < distances.get(next)!) {
                            distances.set(next, newDistance);
                        }
                    }
                }

                return Infinity;
            };

            const minDistance = _(startHolds)
                .flatMap(start => finishHolds
                    .map(end => getShortestPath(start, end)))
                .min()!;

            const startDistance = distance(startHolds[0], startHolds[startHolds.length - 1]);
            const finishDistance = distance(finishHolds[0], finishHolds[finishHolds.length - 1]);

            return startDistance + minDistance + finishDistance;
        }

        const getHoldsCommonality = (problem: MoonboardProblem) => {
            const problemHolds = [
                ...problem.StartHolds,
                ...problem.IntermediateHolds,
                ...problem.FinishHolds
            ]

            return _.sum(problemHolds
                .map(x => scorePerHold[x]))
        }

        const getHoldCount = (problem: MoonboardProblem) => {
            return problem.StartHolds.length
                + problem.IntermediateHolds.length
                + problem.FinishHolds.length
        }

        function easeOut(x: number): number {
            return 1 - Math.pow(1 - x, 20);

        }

        const problemsDifficulty = problems
            .map(x => ({
                problem: x,
                difficulty: easeOut(getMinDistance(x) / (getHoldsCommonality(x) * getHoldCount(x)))
            }))

        const minDifficulty = _(problemsDifficulty)
            .map(x => x.difficulty)
            .min()!

        const maxDifficulty = _(problemsDifficulty)
            .map(x => x.difficulty)
            .max()!

        return problemsDifficulty
            .map(x => ({
                problem: x.problem,
                difficulty: (x.difficulty - minDifficulty) / (maxDifficulty - minDifficulty)
            }))
    }, [])

    const sortOptions: SortOption[] = useMemo(() => [
        {
            label: "Name",
            ascending: false,
            accessor: x => x.Name
        },
        {
            label: "Name",
            ascending: true,
            accessor: x => x.Name
        },
        {
            label: "Difficulty",
            ascending: false,
            accessor: x => problemsDifficulty
                .find(y => y.problem.ImagePath == x.ImagePath)
                ?.difficulty!
        },
        {
            label: "Difficulty",
            ascending: true,
            accessor: x => problemsDifficulty
                .find(y => y.problem.ImagePath == x.ImagePath)
                ?.difficulty!
        },
        {
            label: "Hold Count",
            ascending: false,
            accessor: x => x.StartHolds.length
                + x.IntermediateHolds.length
                + x.FinishHolds.length
        },
        {
            label: "Hold Count",
            ascending: true,
            accessor: x => x.StartHolds.length
                + x.IntermediateHolds.length
                + x.FinishHolds.length
        }
    ], [])

    const [sort, setSort] = useState<SortOption>(sortOptions[0])

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
                sort.accessor,
                x => x.Name
            ],
                [
                    "desc",
                    sort.ascending ? "asc" : "desc",
                    "asc"
                ])
            .value()
    }, [problems, selectedHolds, textFilter, sort])

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

    const DifficultyBadge = (props: { problem: MoonboardProblem }) => {
        return <span className="badge bg-dark-subtle text-dark ms-2">
            <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM352 160C352 142.3 337.7 128 320 128C302.3 128 288 142.3 288 160C288 177.7 302.3 192 320 192C337.7 192 352 177.7 352 160zM320 480C355.3 480 384 451.3 384 416C384 399.8 378 384.9 368 373.7L437.5 234.8C443.4 222.9 438.6 208.5 426.8 202.6C415 196.7 400.5 201.5 394.6 213.3L325.1 352.2C323.4 352.1 321.7 352 320 352C284.7 352 256 380.7 256 416C256 451.3 284.7 480 320 480zM240 208C240 190.3 225.7 176 208 176C190.3 176 176 190.3 176 208C176 225.7 190.3 240 208 240C225.7 240 240 225.7 240 208zM160 352C177.7 352 192 337.7 192 320C192 302.3 177.7 288 160 288C142.3 288 128 302.3 128 320C128 337.7 142.3 352 160 352zM512 320C512 302.3 497.7 288 480 288C462.3 288 448 302.3 448 320C448 337.7 462.3 352 480 352C497.7 352 512 337.7 512 320z" /></svg>
            {(problemsDifficulty
                .find(y => y.problem.ImagePath == props.problem.ImagePath)
                ?.difficulty! * 100).toFixed(0)}</span>
    }

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
                            <svg className="icon me-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M141.4 2.3C103-8 63.5 14.8 53.3 53.2L2.5 242.7C-7.8 281.1 15 320.6 53.4 330.9l189.5 50.8c38.4 10.3 77.9-12.5 88.2-50.9l50.8-189.5c10.3-38.4-12.5-77.9-50.9-88.2L141.4 2.3zm23 205.7a32 32 0 1 1 55.4-32 32 32 0 1 1 -55.4 32zM79.2 220.3a32 32 0 1 1 32 55.4 32 32 0 1 1 -32-55.4zm185 96.4a32 32 0 1 1 -32-55.4 32 32 0 1 1 32 55.4zm9-208.4a32 32 0 1 1 32 55.4 32 32 0 1 1 -32-55.4zm-121 14.4a32 32 0 1 1 -32-55.4 32 32 0 1 1 32 55.4zM418 192L377.4 343.2c-17.2 64-83 102-147 84.9l-38.3-10.3 0 30.2c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64L418 192z" /></svg>
                            Random
                        </button>
                        <button
                            className="btn btn-secondary rounded-0 col border-dark fw-semibold"
                            disabled={selectedProblem != null || selectedHolds.length == 0}
                            onClick={() => setSelectedHolds([])}
                        >
                            <svg className="icon me-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z" /></svg>
                            Clear holds
                        </button>
                    </div>

                    <div className="row">
                        <div className="col pe-0">
                            <input
                                type="text"
                                className="form-input w-100"
                                placeholder="Search"
                                onChange={e => onTextFilterChanged(e.target.value)}
                                defaultValue=""
                            />
                        </div>
                        <div className="col-auto ps-0">
                            <div className="dropdown">
                                <button className="btn btn-sm dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                                    {sort.ascending ? arrowUpIcon : arrowDownIcon} {sort.label}
                                </button>
                                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                                    {sortOptions.map((x, i) =>
                                        <li key={i} onClick={() => setSort(x)}>
                                            <a className={"dropdown-item " + (x == sort ? "active" : "")} href="#">{x.ascending ? arrowUpIcon : arrowDownIcon} {x.label}</a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
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

                            <DifficultyBadge problem={x} />

                            {/*<span className={"badge " + FootRuleBadge[x.FootRules].className}>{FootRuleBadge[x.FootRules].label}</span>*/}
                        </div>)
                }
            </div>

            <div className="bg-warning text-dark position-absolute text-center" style={board.problemPanel} role="button">
                {selectedProblem != null &&
                    <h6 className="mt-1 fw-bold" onClick={() => setSelectedProblem(null)} >
                        {selectedProblem.Name} - {selectedProblem.SetterName}
                        <DifficultyBadge problem={selectedProblem} />
                    </h6>
                }
            </div>

        </div>
    );
}

export default App;