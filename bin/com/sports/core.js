/**
 * @license
 * @author Ben (@iz_ben)
 * Copyright 2014 The Capital Group. All Rights Reserved. http://www.capitalfm.co.ke
 * Capital Sports 2.0
 * Thought of updating on Github...lakini ni unitafute kaa unataka kujua kitu
*/

goog.provide('com.cdm.sports.Core');
goog.provide('sportsinit');


goog.require('goog.net.ScriptManager');

goog.require('com.cdm.sports.Fixtures');
goog.require('com.cdm.sports.HomeSlider');
goog.require('com.cdm.sports.NotificationManager');
goog.require('com.cdm.sports.PageManager');
goog.require('com.cdm.sports.PaginationManager');
goog.require('com.cdm.sports.PredictionManager');
goog.require('com.cdm.sports.Settings');
goog.require('com.cdm.sports.ToTop');

/**
 * @constructor
 */
com.cdm.sports.Core = function()
{
	com.cdm.sports.Core.settings = new com.cdm.sports.Settings;
	
	com.cdm.sports.Core.notification = new com.cdm.sports.NotificationManager;
	
	var pageManager, 
	
	paginationManager,
	
	fixtures,
	top;
	
	this.scriptmanager.loadScripts( cdm['scripts']['general'] );
	
	pageManager = new com.cdm.sports.PageManager;
	
	paginationManager = new com.cdm.sports.PaginationManager;
	
	fixtures = new com.cdm.sports.Fixtures;

	top = new com.cdm.sports.ToTop;
	
	new com.cdm.sports.HomeSlider;
	
	new com.cdm.sports.PredictionManager;
}

/**
 * @type { goog.net.ScriptManager }
 */
com.cdm.sports.Core.prototype.scriptmanager = new goog.net.ScriptManager;

com.cdm.sports.Core.baseurl = cdm['settings']['baseurl'];
/**
 * @type { com.cdm.sports.Settings }
 */
com.cdm.sports.Core.settings = null;

/**
 * @type { com.cdm.sports.NotificationManager }
 */
com.cdm.sports.Core.notification = null;

sportsinit = function()
{
	new com.cdm.sports.Core();
}

goog.exportSymbol( 'sportsinit', sportsinit );

sportsinit();