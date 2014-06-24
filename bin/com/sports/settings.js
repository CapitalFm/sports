// JavaScript Document
goog.provide('com.cdm.sports.Settings');

goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.Checkbox.State');
goog.require('goog.storage.mechanism.HTML5LocalStorage');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
com.cdm.sports.Settings = function()
{
	this.setupStorage();
	this.getSettings();
	this.init_();
}

goog.inherits( com.cdm.sports.Settings, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.Settings.EventType = {
  DISABLEXHR: 'disablexhr',
  ENABLEXHR: 'enablexhr',
  DISABLEINFINITE: 'disableinfinite',
  ENABLEINFINITE: 'enableinfinite'
};

com.cdm.sports.Settings.prototype.xhrLoading = true;

com.cdm.sports.Settings.prototype.infiniteScroll = true;

com.cdm.sports.Settings.prototype.isopen = false;

com.cdm.sports.Settings.prototype.settingsElName = 'user-settings';

com.cdm.sports.Settings.prototype.settingsEl = null;

com.cdm.sports.Settings.prototype.storageManager = null;

com.cdm.sports.Settings.prototype.setupStorage = function()
{
	this.storageManager = new goog.storage.mechanism.HTML5LocalStorage();
	if( ! this.storageManager.isAvailable() )
	{
		console.info( 'Local storage not available' );
	}
}

com.cdm.sports.Settings.prototype.init_ = function()
{
	
	this.settingsEl = goog.dom.getElement( this.settingsElName );
	
	if( !this.settingsEl )
		return;
		
	var toggler, xhrLoaderToggler, infiniteScrollToggler, state;
	
	state = this.xhrLoading==true ? goog.ui.Checkbox.State.CHECKED : goog.ui.Checkbox.State.UNCHECKED;
	xhrLoaderToggler = new goog.ui.Checkbox( state );
	xhrLoaderToggler.render(goog.dom.getElement('xhr-toggler'));
	xhrLoaderToggler.setLabel( goog.dom.getAncestorByTagNameAndClass( xhrLoaderToggler.getElement(), 'li' ) );
	
	state = this.infiniteScroll==true ? goog.ui.Checkbox.State.CHECKED : goog.ui.Checkbox.State.UNCHECKED;
	infiniteScrollToggler = new goog.ui.Checkbox( state );
	infiniteScrollToggler.render(goog.dom.getElement('infinite-scroll-toggler'));
	infiniteScrollToggler.setLabel( goog.dom.getAncestorByTagNameAndClass( infiniteScrollToggler.getElement(), 'li' ) );
	
	toggler = goog.dom.getElementsByTagNameAndClass( 'div', 'toggle', this.settingsEl )[0];
	
	goog.events.listen( toggler, goog.events.EventType.CLICK, this.toggleSettings, true, this );
	
	goog.events.listen( xhrLoaderToggler, goog.ui.Component.EventType.CHANGE, function(e)
	{
		this.xhrLoading = xhrLoaderToggler.getChecked() ? true : false;
		this.storageManager.set('xhr',this.xhrLoading);
		if( this.xhrLoading )
		{
			this.dispatchEvent( com.cdm.sports.Settings.EventType.ENABLEXHR );
			
		}else
		{
			this.dispatchEvent( com.cdm.sports.Settings.EventType.DISABLEXHR );
		}
		//console.log(this.xhrLoading)
	}, true, this );
	
	goog.events.listen( infiniteScrollToggler, goog.ui.Component.EventType.CHANGE, function(e)
	{
		this.infiniteScroll = infiniteScrollToggler.getChecked() ? true : false;
		this.storageManager.set('infinitescroll',this.infiniteScroll);
		if( this.infiniteScroll )
		{
			this.dispatchEvent( com.cdm.sports.Settings.EventType.ENABLEINFINITE );
		}else
		{
			this.dispatchEvent( com.cdm.sports.Settings.EventType.DISABLEINFINITE );
		}
		//console.log(this.infiniteScroll)
	}, true, this );
	
}

com.cdm.sports.Settings.prototype.getSettings = function()
{
	var xhr = this.storageManager.get('xhr'),	
	ls = this.storageManager.get('infinitescroll');
	this.xhrLoading = (xhr == null || xhr == 'true' || xhr == true) ? true : false;
	this.infiniteScroll = (ls == null || ls == 'true' || ls == true) ? true : false;
	//console.log(this.xhrLoading);
	//console.log(this.infiniteScroll);
}

com.cdm.sports.Settings.prototype.toggleSettings = function(e)
{
	var openclass = 'open';
	if( this.isopen )
	{
		goog.dom.classes.remove( this.settingsEl, openclass ); 
	}else
	{
		goog.dom.classes.add( this.settingsEl, openclass ); 
	}
	this.isopen = this.isopen ? false : true;
}