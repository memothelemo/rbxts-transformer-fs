export interface NPMPackage {
	name: string;
	version: string;
	main?: string;
	license: string;
	scripts?: string[];
	devDependencies?: string[];
	dependencies?: string[];
}
