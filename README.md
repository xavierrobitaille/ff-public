# @ff/public

Feather Finance Public Utils

npm login --auth-type legacy
xrobitaille Google Authenticator on iPhone
npm publish --access public --otp 395054

# use a local version of a package

Run the pnpm link command to create a global symlink:
cd ~/dev/ff-public
pnpm link --global

Link the local package in the project:
cd ~/cashr/server
pnpm remove ffpublic
pnpm link /Users/xavier.robitaille/dev/ff-public/
