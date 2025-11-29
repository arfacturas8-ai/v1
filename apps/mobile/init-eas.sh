#!/usr/bin/expect -f

set timeout 30

# Set the environment variable
set env(EXPO_TOKEN) "9zH76AUhi5_HzrOL1TbdjuxAtWBIxYfJfxrM2_kO"

# Start the eas init command
spawn eas init

# Wait for the prompt asking to create a project and respond with yes
expect {
    "*Would you like to create a project*" {
        send "y\r"
        exp_continue
    }
    "*Project is already linked*" {
        send "y\r"
        exp_continue
    }
    "*Enter a project ID*" {
        send "\r"
        exp_continue
    }
    eof
}

wait