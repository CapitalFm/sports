/**
 * @license
 * @author Ben (@iz_ben)
 * Copyright 2014 The Capital Group. All Rights Reserved. http://www.capitalfm.co.ke
 * Capital Sports 2.0
*/

goog.provide('com.cdm.sports.Core');
goog.provide('sportsinit');


goog.require('goog.net.ScriptManager');

goog.require('com.cdm.sports.Fixtures');
goog.require('com.cdm.sports.PageManager');
goog.require('com.cdm.sports.PaginationManager');

/**
 * @constructor
 */
com.cdm.sports.Core = function()
{
	var pageManager, 
	
	paginationManager,
	
	fixtures;
	
	this.scriptmanager.loadScripts( cdm['scripts']['general'] );
	
	pageManager = new com.cdm.sports.PageManager;
	
	paginationManager = new com.cdm.sports.PaginationManager;
	
	fixtures = new com.cdm.sports.Fixtures;

	
}

/**
 * holds the goog.net.ScriptManager instance
 * @type { goog.net.ScriptManager }
 */
com.cdm.sports.Core.prototype.scriptmanager = new goog.net.ScriptManager;

com.cdm.sports.Core.baseurl = cdm['settings']['baseurl'];

sportsinit = function()
{
	new com.cdm.sports.Core();
}

goog.exportSymbol( 'sportsinit', sportsinit );

sportsinit();