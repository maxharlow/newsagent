Datastash
=========

A tool to detect when things happen.

Datastash lets you give it a list of instructions which it runs periodically. For example, this could be scraping a list of names from a website and comparing them against another list of people you are interested in. Each time it runs it compares the results to the previous time. If there are any new records you recieve an email.

Running
-------

Firstly you'll need to clone this repository. You will also need to install [Docker] (https://www.docker.com/products/docker-engine) and [Docker Machine] (https://www.docker.com/products/docker-machine).

Next we need to create two configuration files based on existing example files. The first is for the Runner component which is responsible for running each agent periodically and sending emails when differences are detected. To do this first copy the example file:

    $ cp runner/config.example.json runner/config.json

Then edit `runner/config.json` and set the `email` service -- this should be in [Nodemailer format] (https://github.com/nodemailer/nodemailer-wellknown/blob/master/README.md). You can use Gmail or other services but the easiest choice is to get a free account at an email delivery service such as [Mandrill] (https://www.mandrill.com/).

The second configuration file is for Registry, which creates and manages all the Runners. Copy the example file for this:

    $ cp registry/config.example.json registry/config.json

Though this case nothing needs to be added.

Deploying Datastash then depends on where you want to run it.

If you are running locally, you will need to create a new local virtual machine (unless you use Linux, in which case this is not necessary):

    $ docker-machine create -d virtualbox datastash-local
    $ eval "$(docker-machine env datastash-local)"
    $ VBoxManage controlvm datastash-local natpf1 'local,tcp,,8000,,8000'

If you want to run on AWS, you will need to run [something like this] (https://docs.docker.com/machine/drivers/aws/):

    $ docker-machine create -d amazonec2 \
        --amazonec2-region 'eu-west-1' \
        --amazonec2-instance-type 'm3.medium' \
        datastash-aws
    $ eval "$(docker-machine env datastash-aws)"

You can then build and deploy Datastash to your machine:

    $ docker build -t datastash .
    $ docker run --privileged --name datastash -dp 8000:8000 datastash


Usage
-----

A new agent can then be added, for example:

    $ curl -vX POST <DATASTASH LOCATION>:8000/agents -H 'Content-Type: application/json' -d @- <<EOF
    {
        "name": "MP declares a new financial interest",
        "description": "Scrape the Register of Member's Financial Interests, and alert if anything new is found",
        "location": "https://github.com/maxharlow/scrape-members-financial-interests.git",
        "updatable": true,
        "setup": [],
        "schedule": "0 1 * * *",
        "run": [
            "npm install",
            "node members-financial-interests"
        ],
        "result": "members-financial-interests.csv",
        "alerts": [
            {
                "recipient": "you@example.com"
            }
        ]
    }
    EOF

Get all existing agents:

    $ curl -vX GET <DATASTASH LOCATION>:8000/agents

Remove an agent:

    $ curl -vX DELETE <DATASTASH LOCATION>:8000/agents/<AGENT NAME>


Similar tools
-------------

* [Some unnamed tool built by the LA Times] (https://www.youtube.com/watch?v=iP-On8PzEy8)
* [Scraperwiki] (https://scraperwiki.com/)
* [Logstash] (https://www.elastic.co/products/logstash)
* [Huginn] (https://github.com/cantino/huginn)
* [Datawire] (https://github.com/arc64/datawi.re)
* [Morph] (https://morph.io/)
* [Datastringer] (https://github.com/BBC-News-Labs/datastringer)
* [Yahoo Pipes] (https://en.wikipedia.org/wiki/Yahoo!_Pipes)
* [Change Detection] (https://www.changedetection.com/)
