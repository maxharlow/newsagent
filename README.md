Newsagent
=========

Automatically identify potential story leads.

Newsagent lets you easily create bots to periodically gather data that you are interested in, and then alert you to anything that changes.


Deploying
---------

Firstly you'll need to clone this repository. You will also need [Docker] (https://www.docker.com/products/docker-engine) and [Docker Machine] (https://www.docker.com/products/docker-machine).

Next we need to create configuration files based on existing example files. The first is for the Runner component which is responsible for each agent running periodically and sending emails when differences are detected. To do this first copy the example file:

    $ cp runner/config.example.json runner/config.json

Then edit the `runner/config.json` file, and set the `email` portion -- this should be in [Nodemailer format] (https://github.com/nodemailer/nodemailer-wellknown/blob/master/README.md). You can use Gmail or other services but the easiest choice is to get a free account at an email delivery service such as [Mailgun] (http://www.mailgun.com/).

The second configuration file is for the Registry, which creates and manages the agents. Copy the example file for this:

    $ cp registry/config.example.json registry/config.json

The last configuration file is for the interface:

    $ cp interface/config.example.json interface/config.json

In these cases nothing needs to be added to the file.

### On your local machine

This requires [Virtualbox] (https://www.virtualbox.org/). Create a new virtual machine, and open the necessary ports:

    $ docker-machine create -d virtualbox newsagent
    $ eval "$(docker-machine env newsagent)"
    $ VBoxManage controlvm newsagent natpf1 'registry,tcp,,4001,,4001'
    $ VBoxManage controlvm newsagent natpf1 'interface,tcp,,4000,,4000'

### On an AWS machine

This requires the [AWS CLI] (https://github.com/aws/aws-cli) to be installed and configured. Create a new AWS EC2 machine, and open the necessary ports:

    $ docker-machine create -d amazonec2 \
        --amazonec2-region 'eu-west-1' \
        --amazonec2-instance-type 't2.medium' \
        newsagent
    $ eval "$(docker-machine env newsagent)"
    $ NEWSAGENT_GROUP=$(aws ec2 describe-instances --output text --query 'Reservations[].Instances[?Tags[?Value==`newsagent`]] | [][].SecurityGroups[0].GroupId')
    $ aws ec2 authorize-security-group-ingress --group-id $NEWSAGENT_GROUP --protocol tcp --port 4001 --cidr 0.0.0.0/0
    $ aws ec2 authorize-security-group-ingress --group-id $NEWSAGENT_GROUP --protocol tcp --port 4000 --cidr 0.0.0.0/0

This uses a `t2.medium` machine, which is pretty much the minimum. If you are expecting to use it a lot you may need [a more powerful/expensive machine] (https://aws.amazon.com/ec2/instance-types/).

### Building and running

You can now build and run Newsagent:

    $ docker build -t newsagent .
    $ docker run --privileged --name newsagent -dp 4000-4001:4000-4001 newsagent

It should now be available on port 4000 of your machine.

### Terminating

To stop Newsagent running:

    $ docker stop newsagent
    $ docker rm newsagent
    $ docker rmi newsagent

To shut down the machine it ran on:

    $ docker-machine stop newsagent
    $ docker-machine rm newsagent


Development
-----------

In production Newsagent runs Docker inside a Docker container. For development this is obviously madness, so we can run Newsagent using your local Docker client instead.

You will need [Node] (https://nodejs.org/en/), [Docker] (https://www.docker.com/products/docker-engine), and [Docker Machine] (https://www.docker.com/products/docker-machine).

Use Docker Machine to create a new machine with the Virtualbox driver as above, only use a different name -- `'default'` is recommended. You will need to open port 4000 and 4001 as above too.

As in the deployment instructions, you will need a `config.json` file for the Runner and the Registry. However, the Registry configuration needs to point to your local Docker machine. To do this, edit the `dockerHosts` portion to include something like this:

    {
        "host": "192.168.99.100",
        "port": "2376",
        "certPath": "<PATH TO YOUR HOME DIRECTORY>/.docker/machine/machines/<NAME OF YOUR DOCKER MACHINE>"
    }

You can find the host and port of your Docker Machine by running `docker-machine ls`.

Next, install the dependencies for Runner and the Registry:

    $ cd runner && npm install
    $ cd registry && npm install

From the `registry` directory, you can then run:

    $ node Start

And from the `interface` directory the pages can just be served statically, such as with Python:

    $ python -m SimpleHTTPServer 4000

You then should be able to access the Newsagent interface on port 4000, and the Registry API on port 4001.


Similar tools
-------------

* [Some unnamed tool built by the LA Times] (https://www.youtube.com/watch?v=iP-On8PzEy8)
* [Morph] (https://morph.io/)
* [Huginn] (https://github.com/cantino/huginn)
* [Stakeout] (https://github.com/veltman/stakeout)
* [Change Detection] (https://www.changedetection.com/)
* [Datawire] (https://github.com/arc64/datawi.re)
* [Datastringer] (https://github.com/BBC-News-Labs/datastringer)
* [Logstash] (https://www.elastic.co/products/logstash)
* [Yahoo Pipes] (https://en.wikipedia.org/wiki/Yahoo!_Pipes)
