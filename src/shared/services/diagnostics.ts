import { PACKAGE_NAME } from "@shared/constants";
import ts from "typescript";
import Logger from "./logger";
import { sanitizeInput } from "@shared/util/sanitizeInput";
import chalk from "chalk";

namespace Diagnostics {
    let storage = new Array<ts.DiagnosticWithLocation>();

    export function addDiagnostic(diagnostic: ts.DiagnosticWithLocation) {
        storage.push(diagnostic);
    }

    export function createDiagnostic(
        node: ts.Node,
        category: ts.DiagnosticCategory,
        ...messages: string[]
    ): ts.DiagnosticWithLocation {
        const message_text = messages.join("\n");
        const file = ts.getSourceFileOfNode(node);
        return {
            category,
            file,
            messageText: message_text,
            start: node.getStart(),
            length: node.getWidth(),
            code: ` ${PACKAGE_NAME}` as never,
        };
    }

    export function error(node: ts.Node, ...messages: string[]): never {
        throw new DiagnosticError(createDiagnostic(node, ts.DiagnosticCategory.Error, ...messages));
    }

    export function warn(node: ts.Node, ...messages: string[]) {
        addDiagnostic(createDiagnostic(node, ts.DiagnosticCategory.Warning, ...messages));
    }

    export function flush() {
        const dump = storage;
        storage = [];
        return dump;
    }

    export function capture<T>(fallback: T, callback: () => T): T {
        const lastTreeStack = Logger.getDepth();
        try {
            return callback();
        } catch (error) {
            if (error instanceof DiagnosticError) {
                Logger.resetDepth(lastTreeStack);
                Logger.push(chalk.yellow("Caught diagnostic error!"));
                Logger.value("diagnostic.message", () =>
                    sanitizeInput(error.diagnostic.messageText.toString()),
                );
                Logger.value("diagnostic.path", error.diagnostic.file.path);
                Logger.value("diagnostic.kind", ts.DiagnosticCategory[error.diagnostic.category]);
                Logger.pop();

                addDiagnostic(error.diagnostic);
                return fallback;
            }
            throw error;
        }
    }
}

export class DiagnosticError extends Error {
    public constructor(public readonly diagnostic: ts.DiagnosticWithLocation) {
        super(diagnostic.messageText as string);
    }
}

export default Diagnostics;
