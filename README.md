Datastash
=========

Change detection (and notification) for datasets.

You have data sources which are scraped or otherwise retrieved from somewhere. The data is timestamped and regularly updated -- you want to know when it changes in certain ways. For example, you would like to be sent an email when the unemployment rate has changed, but only if it has gone up or down by at least 10%.

*A work-in-progress.*


How it works
------------

Datastash has two elements -- sources and alerts.

Sources are added via a Git repository -- typically a scraper, but it could just call an API. Such sources are configured with the commands required to install their dependencies, to run the tool, and the name of the CSV file outputted. Datastash will pull from the repository periodically (currently hourly) and run the source. Results are then stored in the database.

Alerts contain queries that run against any new records found each run, a message template, and an email address. These queries are also run hourly. If the source has produced data not seen the last time it was run and the query passes the message is sent to the email address with the new data.


Running
-------

Datastash can be run either locally or on [AWS] (http://aws.amazon.com/). You will first need to clone the source:

    $ git clone https://github.com/maxharlow/datastash.git
    $ cd datastash

### Locally

Running locally requires you have a recent version of [NodeJS] (https://nodejs.org/) installed.

First build the sources and download the requirements:

    $ make local

Then start everything (this will set up the sources to run hourly):

    $ make local.start

To stop everything:

    $ make local.stop

Instead of setting things up to run hourly, just run everything once:

    $ make local.run


### On AWS

Running on AWS requires you have the [AWS CLI] (https://github.com/aws/aws-cli/) installed and configured with your AWS account details. The Datastash resources will be created using your default profile. To use another profile run `export AWS_DEFAULT_PROFILE=other-account-name` before these commands.

To create the stack:

    $ make

To destroy the stack:

    $ make destroy


Usage
-----

Look in the `examples` directory.


Future plans
------------

* Use Docker for process isolation in sources -- take array of requirements to install in source config
* Currently updates to a source can trigger alerts because they change the output -- possibly delete shadow if pull results in an update
* Allow setting of how often sources are run -- hourly will be too often or not often enough for some (esp. long running ones)
* Alerts should be on all records being modified -- including deleted and modified records, not just added
* RSS alert support
* Twitter alert support (DMs?)


Prior art
---------

Other people have built similar tools. Credit to:

* [Some unpublished tool] (https://www.youtube.com/watch?v=iP-On8PzEy8) by the [LA Times] (http://www.latimes.com/)
* [Scraperwiki] (https://scraperwiki.com/)
* [Logstash] (http://www.elasticsearch.org/overview/logstash/)
* [Datawire] (https://github.com/arc64/datawi.re) by [Annabel Church] (https://twitter.com/annabelchurch) and [Friedrich Lindenberg] (https://twitter.com/pudo)
* [Morph] (https://morph.io/) by the [Open Australia Foundation] (https://www.openaustraliafoundation.org.au/)
* [Datastringer] (https://github.com/BBC-News-Labs/datastringer) by the [BBC News Labs] (https://twitter.com/BBC_News_Labs)
* probably others
