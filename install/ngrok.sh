#!/bin/zsh

[[ -d "$XDG_BIN_DIR/ngrok" ]] || {
  NGROK_URL=$(curl --silent https://ngrok.com/download | grep "href" | grep linux-amd | sed -e 's/^.*href="//' -e 's/".*$//')
  curl -O $NGROK_URL
  NGROK_ZIP_FILE=$(ls | grep ngrok*.zip)
  unzip $NGROK_ZIP_FILE
  mv ngrok $XDG_BIN_DIR
  rm -rf $NGROK_ZIP_FILE

  unset NGROK_URL NGROK_ZIP_FILE
}
