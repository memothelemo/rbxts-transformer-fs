import { State } from "@transform/state";
import ts from "typescript";

export function commentNodes(
    state: State,
    startNode: ts.Node,
    endNode: ts.Node,
    comment: string,
    excludeBottom = false,
) {
    if (state.config.disableComments) return;
    state.commentNode(startNode, ` ▼ rbxts-transformer-fs: ${comment} ▼`);
    if (!excludeBottom) state.commentNode(endNode, ` ▲ rbxts-transformer-fs: ${comment} ▲`);
}
