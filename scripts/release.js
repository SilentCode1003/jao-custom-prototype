// scripts/release.js
const { execSync } = require('child_process');
const pkg = require('../package.json');

const type = process.argv[2]; // 'patch', 'minor', or 'major'
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: node scripts/release.js <patch|minor|major>');
  process.exit(1);
}

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

// 1. Calculate the next version string without creating a git commit yet
let [major, minor, patch] = pkg.version.split('.').map(Number);
if (type === 'major') { major++; minor = 0; patch = 0; }
if (type === 'minor') { minor++; patch = 0; }
if (type === 'patch') { patch++; }
const nextVersion = `${major}.${minor}.${patch}`;

// Branch name based on version behavior (e.g., patch/v1.0.4, minor/v1.1.0, major/v2.0.0)
const branchName = `${type}/v${nextVersion}`;

// 2. Create and switch to the new branch
run(`git checkout -b ${branchName}`);

// 3. Stage and commit your code changes on the new branch
run('git add .');
run(`git commit -m "chore(${type}): release v${nextVersion}" --allow-empty`);

// 4. Bump package.json version and create git tag
run(`npm version ${type} -m "chore(release): v%s"`);

// 5. Push the version branch and tags to origin
run(`git push -u origin ${branchName} --tags`);

// 6. Switch to main, merge the branch, and push main
run('git checkout main');
run(`git merge ${branchName}`);
run('git push origin main');

// 7. Publish to npm
run('npm publish');