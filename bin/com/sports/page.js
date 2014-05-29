/**
 * The page.  
 */
goog.provide('com.cdm.sports.Page');

goog.require( 'goog.events.EventTarget' );

goog.require( 'goog.net.ScriptManager' );

goog.require( 'goog.Uri' );

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
com.cdm.sports.Page = function()
{	
	this.scriptManager = new goog.net.ScriptManager;
}


goog.inherits( com.cdm.sports.Page, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.Page.EventType = {
  OPEN: 'open',
  CLOSE: 'close'
};


com.cdm.sports.Page.prototype.close = function()
{
	
}