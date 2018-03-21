const shell = require('shelljs');
const os = require('os');

const exe = {
	err: null,
	output: null
};

const getShellOutput = (cmd, replace) => {
	let output = null;
	let error = null;

	try {
		output = shell.exec(cmd, {
			silent: true
		}).stdout.trim();
	} catch (error) {
		err = error;
		output = null;
	}

	if (null !== error) {
		return {
			error,
			output
		};
	}

	return {
		output: replace ? output.replace(/[\n\r]/g, '') : output,
		error: null
	};
}

const getFtypeArguments = (line) => {
	const ftypeRegEx = /(["'])(?:(?=(\\?))\2.)*?\1/g;
	const regExMatch = line.match(ftypeRegEx);
	if (regExMatch.length === 2) {
		// Found cmd + input arg
		return {
			cmd : regExMatch[0].replace(/\"/g,''),
			arg : regExMatch[1].replace(/\"/g,'').replace('%1','{path}')
		};
	} else {
		return null;
	}
}

const findModeler = () => {
	let findGeneric = true;
	const assoc = getShellOutput('assoc .mpr', true);
	// Find association

	if (assoc.error) {
		exe.err = assoc.error;
	} else if (assoc.output.indexOf('not found') !== -1) {
		exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
	} else if (assoc.output.indexOf('.mpr=') === 0) {
		// Found association, getting the Version Selector
		const association = assoc.output.split('=')[1];
		const ftypeShell = getShellOutput('ftype', false);

		if (ftypeShell.error !== null) {
			exe.err = assoc.error;
		} else {
			const ftype = ftypeShell.output.split('\n').filter(function (line) {
				return line.indexOf(association) !== -1;
			});

			if (ftype.length === 1) {
				// ftype found, getting arguments
				const ftypeArgs = getFtypeArguments(ftype[0]);
				if (ftypeArgs !== null) {
					exe.output = ftypeArgs;
					findGeneric = false;
				}
			}
		}
	} else {
		exe.err = 'Unknown error, cannot find the association for .MPR (Mendix Project) files. Are you on Windows?';
		findGeneric = false;
	}

	if (findGeneric) {
		const ftypeMendixShell = getShellOutput('ftype mendix', true);

		if (ftypeMendixShell.error !== null) {
			exe.err = ftypeMendixShell.error;
		} else if (ftypeMendixShell.output.indexOf('not found') !== -1) {
			exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
		} else {
			// ftype found, getting arguments
			const ftypeArgs = getFtypeArguments(ftypeMendix);
			if (ftypeArgs !== null) {
				exe.output = ftypeArgs;
			} else {
				exe.err = 'No file association found for .mpr, are you sure you installed Mendix?';
			}
		}
	}
}

if (os.platform() !== 'win32') {
	exe.err = 'Unfortunately this feature only works in Windows...';
} else {
	findModeler();
}

module.exports = exe;