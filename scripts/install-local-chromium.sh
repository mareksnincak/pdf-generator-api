mkdir -p ./infra/local/chromium /tmp/chromium

local_chromium_path=$(readlink -f ./infra/local/chromium/)
echo local chromium path: $local_chromium_path

installation_output=$(npx @puppeteer/browsers install chrome-headless-shell@${CHROMIUM_VERSION} --path /tmp/chromium)
echo installation output: $installation_output

installed_binary_path=$(echo $installation_output | awk '{print $2}')
echo installed binary path: $installed_binary_path

installation_dir_path=$(dirname $installed_binary_path)
echo installation dir path: $installation_dir_path

# We are using copy so installer still finds original folder
# and knows not to install the same version again
cp -r $installation_dir_path/ $local_chromium_path  
echo success