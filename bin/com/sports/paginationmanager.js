/**
 * Pagination manager
 * Manages the ajax loading of more pages
 * @author Ben
 */

goog.provide('com.cdm.sports.PaginationManager');

goog.require( 'goog.dom' );
goog.require( 'goog.dom.selection' );

goog.require( 'goog.events.EventTarget' );

goog.require('goog.net.Jsonp');
goog.require( 'goog.net.XhrManager' );

goog.require( 'goog.structs.Map' );

goog.require( 'goog.Uri.QueryData');
goog.require( 'goog.Uri' );

/**
 * @constructor
 * @extends {goog.events.EventTarget} 
 */
com.cdm.sports.PaginationManager = function()
{
	this._init();
}

goog.inherits( com.cdm.sports.PaginationManager, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.PaginationManager.EventType = {
  DONE: 'pmdone',
  ERROR: 'pmerror',
  CONNECTIONERROR: 'pmconnectionerror',
  NOTFOUND: 'pmnotfound'
};


com.cdm.sports.PaginationManager.prototype._init = function()
{
	var btnName = 'pagination-btn',
	
	itemContainerName = 'all-articles';
	
	this.paginationButton = goog.dom.getElement( btnName );
	
	this.itemsContainer = goog.dom.getElement( itemContainerName );
	
	if( this.paginationButton && this.itemsContainer )
	{
		
		this.buttonAncestor = goog.dom.getAncestorByClass( this.paginationButton, 'xhr-paginator' );
		goog.events.listen( this.paginationButton, goog.events.EventType.CLICK, this.fetch, false, this );
	}
}

/**
 * @type {goog.net.XhrManager}
 */
com.cdm.sports.PaginationManager.prototype.xhrManager = new goog.net.XhrManager;


/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.facebookGraphUrl = 'http://graph.facebook.com';

/**
 * @type {number}
 */
com.cdm.sports.PaginationManager.prototype.currentPage = 1;

/**
 * @type {number}
 */
com.cdm.sports.PaginationManager.prototype.itemsPerPage = 10;

/**
 * @type {Array}
 */
com.cdm.sports.PaginationManager.prototype.currentPagesUrls = [];

/**
 * @type {boolean}
 */
com.cdm.sports.PaginationManager.prototype.isLastPage = false;

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.queryHook = cdm['hooks']['pagination'];

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.taxonomy = '';

/**
 * @type {Element}
 */
com.cdm.sports.PaginationManager.prototype.paginationButton = null;

/**
 * @type {Element}
 */
com.cdm.sports.PaginationManager.prototype.buttonAncestor = null

/**
 * @type {Element}
 */
com.cdm.sports.PaginationManager.prototype.itemsContainer = null;

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.articlesHTML = '';

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.itemHtml = cdm['templates']['homestory'];

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.nonce = cdm['settings']['csrf']['pagination'];

/**
 * 
 */
com.cdm.sports.PaginationManager.prototype.fetch = function()
{
	if( this.xhrBusy )
	{
		return false;
	}
	
	this.xhrBusy = true;
	
	this.displaySpinner();
	
	
	var data = goog.Uri.QueryData.createFromMap(
		new goog.structs.Map
		({
			'action':this.queryHook,
			'page':this.currentPage + 1,
			'tax':this.taxonomy,
			'nonce':this.nonce
		})
	).toString();
	
	this.xhrManager.send( 'pagination', cdm.ajaxurl, 'POST', data, null, 1, goog.bind( this.processFeedback, this ) );
	
};

com.cdm.sports.PaginationManager.prototype.processFeedback = function( e )
{
	this.xhrBusy = false;
	
	this.hideSpinner();
	
	var xhr = e.target,
	
	error = xhr.getLastErrorCode();
	
	//console.log(error)
	
	if( ! error)
	{
		var response = xhr.getResponseJson(),
		
		payload = response['payload'],
		
		articles;
		
		if( response == 0 )
		{
			console.log('the sports xhr receptor is not configured');
			
			this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.ERROR );
			
			return;
		}
		
		if(response['status']==200)
		{
			
			this.currentPage++;
			
			articles = response['payload'];
			
			this.articlesHTML = this.generateArticlesHtml( articles );
			
			this.printPage();
			
			this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.DONE );						
			
		}else if(response['status']==403)
		{
			this.nonce = response['nonce'];
		}else
		{
			this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.NOTFOUND );
		}
		
		
	}else if( error == 6 )
	{
		this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.NOTFOUND );
	}
	else if( error == 9 )
	{
		this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.CONNECTIONERROR );
	}else
	{
		this.dispatchEvent( com.cdm.sports.PaginationManager.EventType.ERROR );
	}
	
}
/**
 *@param {Array} article
 *@return {string}
 */
com.cdm.sports.PaginationManager.prototype.storyNode = function( article )
{
	var title, postID, date, coverImage, game, author, permalink, html;
	
	postID = article[0];
	title = article[1];
	coverImage = article[2];
	date = article[3][0];
	game = article[4];
	author = article[5];
	permalink = article[6];
	
	this.currentPagesUrls.push(permalink);
	
	html = this.itemHtml;
	html = html.replace(/%postid%/gi, postID);
	html = html.replace(/%title%/gi, title);
	html = html.replace(/%coverimage%/gi, coverImage);
	html = html.replace(/%date%/gi, date);
	html = html.replace(/%game%/gi, game ? game : '');
	html = html.replace(/%permalink%/gi, permalink);
	
	return html;
	
}
/**
 *@param {Array} articles
 *@return {string}
 */
com.cdm.sports.PaginationManager.prototype.generateArticlesHtml = function( articles )
{
	var total = articles.length,
	html = '';
	
	for( var i = 0; i < total; i++)
	{
		html += this.storyNode( articles[i] );
	}
	
	return html;
	
}

/**
 *
 */
com.cdm.sports.PaginationManager.prototype.printPage = function()
{
	var articlesDom =/** @type {Element} */( goog.dom.htmlToDocumentFragment( this.articlesHTML ) ),
	
	currentPageDom = goog.dom.createDom('div', { 'class':'page-'+( this.currentPage - 1 ) }, articlesDom );
	
	this.itemsContainer.appendChild( currentPageDom );
	
	this.getFacebookShares( currentPageDom, this.currentPagesUrls );
	
	this.currentPagesUrls = [];//new array to handle the next request
}


com.cdm.sports.PaginationManager.prototype.getFacebookShares = function( dom, urls )
{
	var apiEndpoint = new goog.Uri( this.facebookGraphUrl );
	
	apiEndpoint.setParameterValue( 'ids',urls.join(',') );
	
	var jsonp = new goog.net.Jsonp(	apiEndpoint );
	
	jsonp.send( {}, goog.bind( this.printFacebookShares, this, dom, urls ) );	
	
}

com.cdm.sports.PaginationManager.prototype.printFacebookShares = function( dom, urls, shares )
{
	var documentFragment,
	
	shareTexts = [],
	
	shareDivs;
	
	
	
	documentFragment = dom;
	
	shareDivs = goog.dom.getElementsByTagNameAndClass('span', 'facebook-share-count', documentFragment );
	
	//console.log(shareDivs);
	
	for( var i = 0, j = shareDivs.length, shareItem, shareCount, currenturl; i < j; i++ )
	{
		shareItem =  shareDivs[i];
		
		//console.log(shareItem);
		
		currenturl = urls[i];
		
		console.log( currenturl );
		
		shareCount = ( 'undefined' == typeof shares[currenturl] || 'undefined' == typeof shares[currenturl]['shares']) ? 0 : shares[currenturl]['shares'];
		
		goog.dom.setTextContent( shareItem, shareCount )
	}
	
	
	
	//console.log(urls);
	//console.log(shares);
}

/**
 * 
 */
com.cdm.sports.PaginationManager.prototype.displaySpinner = function()
{
	goog.dom.classes.add( this.buttonAncestor, 'working'); 
}

com.cdm.sports.PaginationManager.prototype.hideSpinner = function()
{
	goog.dom.classes.remove( this.buttonAncestor, 'working'); 
}