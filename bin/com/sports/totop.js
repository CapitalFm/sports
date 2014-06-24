// JavaScript Document
goog.provide('com.cdm.sports.ToTop');

goog.require( 'goog.dom' );
goog.require('goog.ui.ScrollTo');

/**
 * @constructor
 */
com.cdm.sports.ToTop = function()
{
	var totoplinkname = 'totop', totopel, scrollManager;
	
	scrollManager = new goog.ui.ScrollTo;
	
	totopel = goog.dom.getElement( totoplinkname );
	
	if(totopel)
	{
		goog.events.listen( totopel, goog.events.EventType.CLICK, function(e)
		{
			e.preventDefault();
			scrollManager.scroll(0);
			return false;
		}, false, this );
	}
	
	
}