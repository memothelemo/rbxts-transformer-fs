import ts from "typescript";
import { TransformContext } from "../context";

export function isSignatureFromTransformer(context: TransformContext, signature: ts.Signature) {
	const { declaration } = signature;
	if (!declaration || ts.isJSDocSignature(declaration) || !context.isTransformerModule(declaration.getSourceFile())) {
		return [false, undefined] as const;
	}
	return [true, declaration] as const;
}
