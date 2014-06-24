/**
 * Takes ---> http://capitalfm-widget.365.co.za/widget/index.html 
 * and converts into the html we actually needed from them
 * but they didn't do it cz they wanted to insert their own ads and trackers into our site. smh
 * removes all posibility of an xss. All external js is safely ignored
 */
goog.provide('com.cdm.sports.Fixtures');

goog.require( 'goog.dom' );
goog.require( 'goog.dom.selection' );
goog.require( 'goog.events.EventTarget' );
goog.require('goog.net.jsloader');
goog.require( 'goog.structs.Map' );
goog.require( 'goog.Uri.QueryData');
goog.require( 'goog.Uri' );



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * To overhaul...the source is no longer valid...
 */
com.cdm.sports.Fixtures = function()
{
	this.init_();
}


goog.inherits( com.cdm.sports.Fixtures, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.Fixtures.EventType = {
  OPEN: 'open',
  CLOSE: 'close',
  ERROR: 'error'
};


com.cdm.sports.Fixtures.prototype.timeout_ = 5000

com.cdm.sports.Fixtures.prototype.fixturesUrl = cdm['scripts']['fixtures'];

com.cdm.sports.Fixtures.prototype.scoresContainer = null;

com.cdm.sports.Fixtures.prototype.fixtureList = null;

com.cdm.sports.Fixtures.prototype.fixtureHTML = cdm['templates']['fixtureitem'];

com.cdm.sports.Fixtures.prototype.init_ = function()
{
	
	var scoreContainerName = 'live-scores';
	
	this.scoresContainer = goog.dom.getElement( scoreContainerName );
	
	
	if( ! this.scoresContainer )
		return;
	
	
	window['handler'] = goog.bind( this.processFixtures, this );
	
	var deferred = goog.net.jsloader.load( this.fixturesUrl.toString(),
	{
		timeout: this.timeout_
	});
	
}

com.cdm.sports.Fixtures.prototype.processFixtures = function( data )
{
	var	rawEntries,
	
	scoresNode,
	
	urls,
	
	expression,
	
	regex;
	
	scoresNode = /** @type {Element} */( goog.dom.htmlToDocumentFragment( data ) );
	
	rawEntries = goog.dom.getElementsByTagNameAndClass( 'div', 'entry', scoresNode );
	
	//expression = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
	
	//regex = new RegExp(expression);
	
	//urls = data.match( regex );
	
	//console.log( urls )
	
	for( var i = 0, j = rawEntries.length, logos, names, scores, time, entryDetails = []; i < j; i++ )
	{
		logos = goog.dom.getElementsByTagNameAndClass( 'img', 'teamLogo', rawEntries[i] );
		names = goog.dom.getElementsByTagNameAndClass( 'p', 'teamName', rawEntries[i] );
		scores = goog.dom.getElementsByTagNameAndClass( 'div', 'score', rawEntries[i] );
		time = goog.dom.getElementsByTagNameAndClass( 'p', null, goog.dom.getElementByClass( 'entryTime', rawEntries[i] ) );
		
		time =  goog.dom.getTextContent(/** @type {Node}*/( time[0] ) );
		
		
		for( var k = 0, logosrc = [], teamnames = [], teamscores=[]; k < 2; k++ )
		{
			logosrc[k]=( logos[k].src );
			
			teamnames[k]=( goog.dom.getTextContent(/** @type {Node}*/( names[k] ) ) );
			
			teamscores[k]=( goog.dom.getTextContent(/** @type {Node}*/( scores[k] ) ) );
			
			entryDetails[i] = ([ logosrc, teamnames, teamscores, time ])
			
		}
		
		this.fixtureList = ( entryDetails );
		
	}
	
	//console.log( this.fixtureList );
	
	
	this.printFixtures();
	//console.log(data)
}

com.cdm.sports.Fixtures.prototype.printFixtures = function()
{
	var html,
	
	fixturesDom;
	
	html = '';
	
	for( var i=0, j = this.fixtureList.length; i < j; i++  )
	{
		html += this.fixtureNode( this.fixtureList[i] );
	}
	
	fixturesDom =/** @type {Element} */(goog.dom.htmlToDocumentFragment( html ))
	
	this.scoresContainer.appendChild( fixturesDom );
}

/**
 * @param {Array} fixture
 * @return {string}
 */
com.cdm.sports.Fixtures.prototype.fixtureNode = function( fixture )
{
	var html = this.fixtureHTML;
	
	
	html = html.replace(/%badge1%/gi, fixture[0][0]);
	html = html.replace(/%name1%/gi, fixture[1][0]);
	html = html.replace(/%score1%/gi, fixture[2][0]);
	
	html = html.replace(/%badge2%/gi, fixture[0][1]);
	html = html.replace(/%name2%/gi, fixture[1][1]);
	html = html.replace(/%score2%/gi, fixture[2][1]);
	
	html = html.replace(/%time%/gi, fixture[3]);
	
	//console.log( html )
	
	return html;
	
}