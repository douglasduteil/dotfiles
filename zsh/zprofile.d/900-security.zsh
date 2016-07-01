GPGHOME=$HOME/.gnupg
ABSFILE="$HOME/.ssh/id_rsa"
SSH_ADD="/usr/bin/ssh-add $ABSFILE"

# ssh-agent
function add_id()
{
    pw=$(pass show system/ssh | tr '\n' ' ' | sed 's/ //g')
    sshpw=$(echo $pw | sed -e 's/["]/\\"/g' \
			    -e 's/[(]/\\(/g' -e 's/[)]/\\)/g' \
			    -e 's/[[]/\\[/g' -e 's/[]]/\\]/g' \
			    -e 's/[{]/\\{/g' -e 's/[}]/\\}/g')
    if [ -n "$sshpw" ]; then
	expect -c "spawn $SSH_ADD;expect \"Enter passphrase for $ABSFILE:\";send \"$sshpw\\r\";expect \"Identity added: $ABSFILE ($ABSFILE)\";expect eof"
    fi
}

function choose_pinentry()
{
    local pinentry_program=$1
    cat $GPGHOME/gpg-agent-base.conf > $GPGHOME/gpg-agent.conf
    echo "pinentry-program $pinentry_program" >> $GPGHOME/gpg-agent.conf
    systemctl --user restart gpg-agent
}
