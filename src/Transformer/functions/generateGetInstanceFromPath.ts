import ts, { factory } from "byots";
import RojoResolver from "../../RojoResolver";
import { assert } from "../../Shared/functions/assert";
import { TransformState } from "../state";
import { propertyAccessExpressionChain } from "../util/expressionChain";

export function generateGetInstanceFromPath(
	state: TransformState,
	sourceFile: ts.SourceFile,
) {
	let root: ts.Identifier | ts.PropertyAccessExpression;
	let stringedRoot: string;
	if (state.projectType === RojoResolver.ProjectType.Game) {
		root = factory.createIdentifier("game");
		stringedRoot = "game";
	} else {
		assert(state.rojoResolver, "Rojo is not resolved");

		const sourceOutPath = state.pathTranslator.getOutputPath(
			sourceFile.fileName,
		);

		const projectPath = state.rojoResolver.getRbxPathFromFilePath(
			state.currentDir,
		);

		const rbxPath =
			state.rojoResolver.getRbxPathFromFilePath(sourceOutPath);

		const names = RojoResolver.Project.relative(rbxPath!, projectPath!).map(
			v => (v === RojoResolver.RbxPathParent ? "Parent" : v),
		);

		root = propertyAccessExpressionChain(state, names);
		stringedRoot = names.join(".");
	}

	return factory.createFunctionDeclaration(
		undefined,
		undefined,
		undefined,
		factory.createIdentifier("___getInstanceFromPath"),
		[
			factory.createTypeParameterDeclaration(
				factory.createIdentifier("T"),
				undefined,
				undefined,
			),
		],
		[
			factory.createParameterDeclaration(
				undefined,
				undefined,
				undefined,
				factory.createIdentifier("entries"),
				undefined,
				factory.createArrayTypeNode(
					factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
				),
				undefined,
			),
			factory.createParameterDeclaration(
				undefined,
				undefined,
				undefined,
				factory.createIdentifier("waitFor"),
				undefined,
				undefined,
				factory.createFalse(),
			),
			factory.createParameterDeclaration(
				undefined,
				undefined,
				undefined,
				factory.createIdentifier("timeout"),
				undefined,
				undefined,
				factory.createNumericLiteral("0"),
			),
		],
		undefined,
		factory.createBlock(
			[
				factory.createVariableStatement(
					undefined,
					factory.createVariableDeclarationList(
						[
							factory.createVariableDeclaration(
								factory.createIdentifier("currentIndex"),
								undefined,
								undefined,
								factory.createNumericLiteral("0"),
							),
						],
						ts.NodeFlags.Let,
					),
				),
				factory.createVariableStatement(
					undefined,
					factory.createVariableDeclarationList(
						[
							factory.createVariableDeclaration(
								factory.createIdentifier("lastParent"),
								undefined,
								factory.createTypeReferenceNode(
									factory.createIdentifier("Instance"),
									undefined,
								),
								ts.clone(root),
							),
						],
						ts.NodeFlags.Let,
					),
				),
				factory.createVariableStatement(
					undefined,
					factory.createVariableDeclarationList(
						[
							factory.createVariableDeclaration(
								factory.createIdentifier("currentObject"),
								undefined,
								factory.createUnionTypeNode([
									factory.createTypeReferenceNode(
										factory.createIdentifier("Instance"),
										undefined,
									),
									factory.createKeywordTypeNode(
										ts.SyntaxKind.UndefinedKeyword,
									),
								]),
								ts.clone(root),
							),
						],
						ts.NodeFlags.Let,
					),
				),
				factory.createWhileStatement(
					factory.createBinaryExpression(
						factory.createBinaryExpression(
							factory.createIdentifier("currentIndex"),
							factory.createToken(ts.SyntaxKind.LessThanToken),
							factory.createCallExpression(
								factory.createPropertyAccessExpression(
									factory.createIdentifier("entries"),
									factory.createIdentifier("size"),
								),
								undefined,
								[],
							),
						),
						factory.createToken(
							ts.SyntaxKind.AmpersandAmpersandToken,
						),
						factory.createBinaryExpression(
							factory.createIdentifier("currentObject"),
							factory.createToken(
								ts.SyntaxKind.ExclamationEqualsEqualsToken,
							),
							factory.createIdentifier("undefined"),
						),
					),
					factory.createBlock(
						[
							factory.createExpressionStatement(
								factory.createBinaryExpression(
									factory.createIdentifier("lastParent"),
									factory.createToken(
										ts.SyntaxKind.EqualsToken,
									),
									factory.createIdentifier("currentObject"),
								),
							),
							factory.createExpressionStatement(
								factory.createBinaryExpression(
									factory.createIdentifier("currentObject"),
									factory.createToken(
										ts.SyntaxKind.EqualsToken,
									),
									factory.createConditionalExpression(
										factory.createIdentifier("waitFor"),
										factory.createToken(
											ts.SyntaxKind.QuestionToken,
										),
										factory.createCallExpression(
											factory.createPropertyAccessExpression(
												factory.createIdentifier(
													"currentObject",
												),
												factory.createIdentifier(
													"WaitForChild",
												),
											),
											undefined,
											[
												factory.createElementAccessExpression(
													factory.createIdentifier(
														"entries",
													),
													factory.createIdentifier(
														"currentIndex",
													),
												),
												factory.createIdentifier(
													"timeout",
												),
											],
										),
										factory.createToken(
											ts.SyntaxKind.ColonToken,
										),
										factory.createCallExpression(
											factory.createPropertyAccessExpression(
												factory.createIdentifier(
													"currentObject",
												),
												factory.createIdentifier(
													"FindFirstChild",
												),
											),
											undefined,
											[
												factory.createElementAccessExpression(
													factory.createIdentifier(
														"entries",
													),
													factory.createIdentifier(
														"currentIndex",
													),
												),
											],
										),
									),
								),
							),
							factory.createExpressionStatement(
								factory.createPostfixUnaryExpression(
									factory.createIdentifier("currentIndex"),
									ts.SyntaxKind.PlusPlusToken,
								),
							),
						],
						true,
					),
				),
				factory.createIfStatement(
					factory.createBinaryExpression(
						factory.createIdentifier("currentObject"),
						factory.createToken(
							ts.SyntaxKind.EqualsEqualsEqualsToken,
						),
						factory.createIdentifier("undefined"),
					),
					factory.createBlock(
						[
							factory.createExpressionStatement(
								factory.createCallExpression(
									factory.createPropertyAccessExpression(
										factory.createIdentifier("entries"),
										factory.createIdentifier("unshift"),
									),
									undefined,
									[factory.createStringLiteral(stringedRoot)],
								),
							),
							factory.createExpressionStatement(
								factory.createCallExpression(
									factory.createIdentifier("error"),
									undefined,
									[
										factory.createTemplateExpression(
											factory.createTemplateHead(
												"Cannot find ",
												"Cannot find ",
											),
											[
												factory.createTemplateSpan(
													factory.createCallExpression(
														factory.createPropertyAccessExpression(
															factory.createIdentifier(
																"entries",
															),
															factory.createIdentifier(
																"join",
															),
														),
														undefined,
														[
															factory.createStringLiteral(
																".",
															),
														],
													),
													factory.createTemplateMiddle(
														" because ",
														" because ",
													),
												),
												factory.createTemplateSpan(
													factory.createElementAccessExpression(
														factory.createIdentifier(
															"entries",
														),
														factory.createIdentifier(
															"currentIndex",
														),
													),
													factory.createTemplateMiddle(
														" is not a child of ",
														" is not a child of ",
													),
												),
												factory.createTemplateSpan(
													factory.createCallExpression(
														factory.createPropertyAccessExpression(
															factory.createIdentifier(
																"lastParent",
															),
															factory.createIdentifier(
																"GetFullName",
															),
														),
														undefined,
														[],
													),
													factory.createTemplateTail(
														"",
														"",
													),
												),
											],
										),
										factory.createNumericLiteral("2"),
									],
								),
							),
						],
						true,
					),
					undefined,
				),
				factory.createReturnStatement(
					factory.createAsExpression(
						factory.createAsExpression(
							factory.createIdentifier("currentObject"),
							factory.createKeywordTypeNode(
								ts.SyntaxKind.UnknownKeyword,
							),
						),
						factory.createTypeReferenceNode(
							factory.createIdentifier("T"),
							undefined,
						),
					),
				),
			],
			true,
		),
	);
}
