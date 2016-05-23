Datastash
=========

An automated lead generation tool.

Datastash lets you easily create powerful bots that periodically gather data that you are interested in, and alert you to anything that changes. For example, this could be scraping a list of names from a website and comparing them against another list of politically notable people.


Deploying
---------

Firstly you'll need to clone this repository. You will also need to install [Docker] (https://www.docker.com/products/docker-engine) and [Docker Machine] (https://www.docker.com/products/docker-machine).

Next we need to create two configuration files based on existing example files. The first is for the Runner component which is responsible for running each agent periodically and sending emails when differences are detected. To do this first copy the example file:

    $ cp runner/config.example.json runner/config.json

Then edit `runner/config.json` and set the `email` service -- this should be in [Nodemailer format] (https://github.com/nodemailer/nodemailer-wellknown/blob/master/README.md). You can use Gmail or other services but the easiest choice is to get a free account at an email delivery service such as [Mailgun] (http://www.mailgun.com/).

The second configuration file is for Registry, which creates and manages all the Runners. Copy the example file for this:

    $ cp registry/config.example.json registry/config.json

Though this case nothing needs to be added.

Deploying Datastash then depends on where you want to run it.

If you are running locally, you will need to create a new local virtual machine (unless you use Linux, in which case this is not necessary):

    $ docker-machine create -d virtualbox datastash-local
    $ eval "$(docker-machine env datastash-local)"
    $ VBoxManage controlvm datastash-local natpf1 'registry,tcp,,4001,,4001'
    $ VBoxManage controlvm datastash-local natpf1 'interface,tcp,,4000,,4000'

If you want to run on AWS, you will need to run [something like this] (https://docs.docker.com/machine/drivers/aws/):

    $ docker-machine create -d amazonec2 \
        --amazonec2-region 'eu-west-1' \
        --amazonec2-instance-type 'm3.medium' \
        datastash-aws
    $ eval "$(docker-machine env datastash-aws)"

You can then build and deploy Datastash to your machine:

    $ docker build -t datastash .
    $ docker run --privileged --name datastash -dp 4000-4001:4000-4001 datastash

The Datastash interface will then be available on port 4000, and the Registry API on port 4001.

To stop Datastash:

    $ docker stop datastash
    $ docker rm datastash

The built image can then be removed:

    $ docker rmi datastash

To remove the local machine:

    $ docker-machine stop datastash-local
    $ docker-machine rm datastash-local


Similar tools
-------------

* [Some unnamed tool built by the LA Times] (https://www.youtube.com/watch?v=iP-On8PzEy8)
* [Morph] (https://morph.io/)
* [Scraperwiki] (https://scraperwiki.com/)
* [Logstash] (https://www.elastic.co/products/logstash)
* [Huginn] (https://github.com/cantino/huginn)
* [Datawire] (https://github.com/arc64/datawi.re)
* [Datastringer] (https://github.com/BBC-News-Labs/datastringer)
* [Stakeout] (https://github.com/veltman/stakeout)
* [Yahoo Pipes] (https://en.wikipedia.org/wiki/Yahoo!_Pipes)
* [Change Detection] (https://www.changedetection.com/)
