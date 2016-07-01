# =================================================================
# Miscellaneous
# =================================================================


# Rough calc
calc() { perl -wlne 'print eval'; }
export calc


# TOPTEN
function topten
{
    echo $(history 1 | \
	awk '{print $2}' | \
	awk 'BEGIN {FS="|"} {print $1}' | \
	sort | \
	uniq -c | \
	sort -nr | \
	head -n 10)
}


function abspath
{
    python -c "import os.path as op;print(op.abspath(\"$1\"))"
}


# default date prefix for development tagging
function dprefix
{
   date +'%Y/%m/%d'
}


function dversion
{
    date +'%Y.%m.%d.%H%M'
}


function setgit
{
   git config --add user.name "Ariel De Ocampo"
   git config --add user.email "python.$1@gmail.com"
}


# TMUX
function mksc()
{
   TERM=screen-256color-bce /usr/bin/tmux new-session -d -s $1
}


function rmsc()
{
   /usr/bin/tmux kill-session -t $1
}


function rsc()
{
   TMUX=/usr/bin/tmux
   CLIENTID=$1.$(date +%Y%m%d%H%M%S)
   TERM=screen-256color-bce $TMUX new-session -d -t $1 -s $CLIENTID \; set-option -q destroy-unattached \; attach-session -t $CLIENTID
}


function rsc_new_window()
{
   TMUX=/usr/bin/tmux
   CLIENTID=$1.$(date +%Y%m%d%H%M%S)
   TERM=screen-256color-bce $TMUX new-session -d -t $1 -s $CLIENTID \; set-option -q destroy-unattached \; attach-session -t $CLIENTID \; new-window -t $CLIENTID
}


# fzf integration
function general_fzf()
{
    local files
    files=(${(f)"$($1 $2 | fzf)"})

    if [[ -n $files ]]; then
	echo $files
    fi
}

function ff()
{
    echo $(general_fzf find .)
}

function hf()
{
    echo $(general_fzf locate $HOME)
}

function lf()
{
    echo $(general_fzf locate /)
}


# =================================================================
#
# =================================================================
