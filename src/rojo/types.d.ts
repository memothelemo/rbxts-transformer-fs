interface RojoTreeProperty {
	Type: string;
	Value: unknown;
}

interface RojoTreeMetadata {
	$className?: string;
	$path?: string;
	$properties?: Array<TreeProperty>;
	$ignoreUnknownInstances?: boolean;
	$isolated?: boolean;
}

interface RojoTreeMembers {
	[name: string]: Tree;
}

type RojoTree = RojoTreeMembers & RojoTreeMetadata;

interface RojoConfig {
	servePort?: number;
	name: string;
	tree: RojoTree;
}
