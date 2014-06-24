/**
 * Pagination manager
 * Overrides and ajaxifies the default pagination functionality
 * @author Ben
 */

goog.provide('com.cdm.sports.PaginationManager');

goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.dom.selection');
goog.require('goog.events.EventTarget');
goog.require('goog.net.Jsonp');
goog.require('goog.net.XhrManager');
goog.require('goog.structs.Map');
goog.require('goog.Uri.QueryData');
goog.require('goog.Uri');
goog.require('com.cdm.sports.Settings');

/**
 * @constructor
 * @extends {goog.events.EventTarget} 
 */
com.cdm.sports.PaginationManager = function()
{
	this._init();
	if( ! this.paginationWrapper )
		return;
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.DISABLEXHR, this.disableXhr, true, this );
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.ENABLEXHR, this.enableXhr, true, this );
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.DISABLEINFINITE, this.disableInfinite, true, this );
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.ENABLEINFINITE, this.enableInfinite, true, this );
	
	goog.events.listen(window, goog.events.EventType.SCROLL, this.infiniteScroll, true, this);
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
	
	itemContainerName = 'all-articles',
	
	paginationWrapperName = 'paging-navigation';
	
	this.queryVars = {};
	
	this.itemHtml = this.isHome ? cdm['templates']['homestory'] : cdm['templates']['taxonomyitem'];
	
	if( !this.isHome )
	{
		this.paginationWrapper = goog.dom.getElementsByTagNameAndClass(null, paginationWrapperName)[0];
		if( !this.paginationWrapper )
			return;
		this.setupPagination();
		return;
	}
	
	this.paginationButton = goog.dom.getElement( btnName );
	
	this.itemsContainer = goog.dom.getElement( itemContainerName );
	
	if( this.paginationButton && this.itemsContainer )
	{
		
		this.buttonAncestor = goog.dom.getAncestorByClass( this.paginationButton, 'xhr-paginator' );
		goog.events.listen( this.paginationButton, goog.events.EventType.CLICK, this.fetch, false, this );
	}
}

/**
 * @type {boolean}
 * Checks if we're on the home page
 */
com.cdm.sports.PaginationManager.prototype.isHome = cdm['settings']['ishome'];

/**
 * @type {goog.net.XhrManager}
 */
com.cdm.sports.PaginationManager.prototype.xhrManager = new goog.net.XhrManager;


/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.facebookGraphUrl = cdm['api']['facebookgraph'];

/**
 * @type {number}
 */
com.cdm.sports.PaginationManager.prototype.currentPage = 1;

/**
 * @type {number}
 * Number of articles to fetcch per page
 * [to-do] Fetch the number of items indicated in the per page settings in the wordpress admin 
 */
com.cdm.sports.PaginationManager.prototype.itemsPerPage = 10;

/**
 * @type {Array}
 * Stores the urls in the current request; for resolving sharing counts for the articles
 */
com.cdm.sports.PaginationManager.prototype.currentPagesUrls = [];

/**
 * @type {boolean}
 * Are we on the last page of the items in the current section?
 */
com.cdm.sports.PaginationManager.prototype.isLastPage = false;

/**
 * @type {string}
 * Action hook the site is expecting for this request
 */
com.cdm.sports.PaginationManager.prototype.queryHook = cdm['hooks']['pagination'];

/**
 * @type {string}
 * Current category/section
 * Will probably remove it from the final version
 */
com.cdm.sports.PaginationManager.prototype.taxonomy = '';

/**
 * @type {string}
 * Is there an xhr request currently being executed?
 */
com.cdm.sports.PaginationManager.prototype.xhrBusyClass = 'working'

/**
 * @type {Object}
 */
com.cdm.sports.PaginationManager.prototype.queryVars = null;

/**
 * @type {Object}
 */
com.cdm.sports.PaginationManager.prototype.paginationConfiguration = null;

/**
 * @type {Element}
 * the pagination links being replaced
 */
com.cdm.sports.PaginationManager.prototype.paginationLinks = null;


/**
 * @type {Element}
 * Site footer...its height is needed to calculate the proximity to the bottom of the page for the infinite scroller
 */
com.cdm.sports.PaginationManager.prototype.pageFooter = null;

/**
 * @type {Element}
 * The container that will hold the pagination trigger button
 */
com.cdm.sports.PaginationManager.prototype.paginationWrapper = null;

/**
 * @type {Element}
 * Contains the configuration settings in the 'config' dataset
 */
com.cdm.sports.PaginationManager.prototype.paginationWrapperParent = null;

/**
 * @type {Element}
 * The button that triggers loading of the next page when clicked.
 * Kinda redundant when the infinite scroll is on
 */
com.cdm.sports.PaginationManager.prototype.paginationButton = null;

/**
 * @type {Element}
 */
com.cdm.sports.PaginationManager.prototype.buttonAncestor = null

/**
 * @type {Element}
 * The dom element/node into which new article containers will be inserted
 */
com.cdm.sports.PaginationManager.prototype.itemsContainer = null;

/**
 * @type {string}
 */
com.cdm.sports.PaginationManager.prototype.articlesHTML = '';

/**
 * @type {string}
 * the html structure for an article item
 * generated via php
 */
com.cdm.sports.PaginationManager.prototype.itemHtml = '';

/**
 * @type {string}
 * Security nonce to verify the source of the ajax request...
 * Access-Control-Allow-Origin controls client requests, this one manages curl requests
 */
com.cdm.sports.PaginationManager.prototype.nonce = cdm['settings']['csrf']['pagination'];

com.cdm.sports.PaginationManager.prototype.setupPagination = function()
{
	var pageLinksContainerName = 'loop-pagination',
	
	configurationstr = goog.dom.dataset.get( this.paginationWrapper, 'config' ),
	/**
	 * @type {Object}
	 */
	configuration = goog.json.unsafeParse( /** @type {string} */( configurationstr ) );
	
	this.currentPage = configuration['page'];
	
	this.queryVars = configuration;
	
	this.paginationLinks = goog.dom.getElementsByTagNameAndClass('div', pageLinksContainerName, this.paginationWrapper )[0];
	
	this.itemsContainer = goog.dom.getElementsByTagNameAndClass('div', 'stories-holder' )[0];
	
	this.paginationWrapperParent = goog.dom.getAncestorByClass( this.paginationWrapper, 'col-sm-12' );
	
	this.pageFooter = goog.dom.getElement( 'primary-footer' );
	
	this.buttonAncestor = goog.dom.createDom('div',{'class':'xhr-paginator clearfix'},
		(this.paginationButton = goog.dom.createDom('a',null, cdm['messages']['loadmore']))	
	)//goog.dom.getAncestorByClass( this.paginationButton, 'xhr-paginator' );
	//this.paginationButton = goog.dom.createDom('a',null);
	
	if( com.cdm.sports.Core.settings.xhrLoading )
	{
		goog.dom.removeChildren(/** @type {Node} */( this.paginationWrapper ) );
		this.paginationWrapper.appendChild( this.buttonAncestor );
	}
	
	goog.events.listen( this.paginationButton, goog.events.EventType.CLICK, this.fetch, false, this );
	
	this.fetch();
	//this.itemsContainer
	//console.info( this.buttonAncestor );
}
/**
 * 
 */
com.cdm.sports.PaginationManager.prototype.fetch = function()
{
	if( ! com.cdm.sports.Core.settings.xhrLoading )
		return;
		
	if( this.xhrBusy )
	{
		return false;
	}
	
	this.xhrBusy = true;
	
	this.displaySpinner();
	
	var queryData = this.queryVars;
	
	queryData['action'] = this.queryHook;
	queryData['page'] = this.currentPage + 1
	//queryData['tax'] = this.taxonomy
	queryData['home'] = this.isHome
	queryData['nonce'] = this.nonce
	
	var data = goog.Uri.QueryData.createFromMap(
		new goog.structs.Map(queryData)
	).toString();
	
	this.xhrManager.send( 'pagination', cdm.ajaxurl, 'POST', data, null, 1, goog.bind( this.processFeedback, this ) );
	
};


/**
 * makes sense of the server replies
 */
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
			console.log(cdm['messages']['xhrnotconfigured']);
			
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
	var extraClass = this.isHome ? '':' row',
	
	articlesDom =/** @type {Element} */( goog.dom.htmlToDocumentFragment( this.articlesHTML ) ),
	
	currentPageDom = goog.dom.createDom('div', { 'class':'page-'+( this.currentPage - 1 ) + extraClass }, articlesDom );
	
	if( this.paginationWrapperParent )
	{
		goog.dom.insertSiblingBefore( /** @type {Node} */( currentPageDom ), /** @type {Node} */( this.paginationWrapperParent ) );
	}else
	{
		this.itemsContainer.appendChild( currentPageDom );
	}
	
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
		
		//console.log( currenturl );
		
		shareCount = ( 'undefined' == typeof shares[currenturl] || 'undefined' == typeof shares[currenturl]['shares']) ? 0 : shares[currenturl]['shares'];
		
		goog.dom.setTextContent( shareItem, shareCount )
	}
	
	
	
	//console.log(urls);
	//console.log(shares);
}

/**
 * Displays the spinner.
 * TODO: replace bars processing indicator with rotating spinner...preferably SVG
 */
com.cdm.sports.PaginationManager.prototype.displaySpinner = function()
{
	goog.dom.classes.add( this.buttonAncestor, this.xhrBusyClass ); 
}

/**
 * 
 */
com.cdm.sports.PaginationManager.prototype.hideSpinner = function()
{
	goog.dom.classes.remove( this.buttonAncestor, this.xhrBusyClass ); 
}


/**
 * 
 */
com.cdm.sports.PaginationManager.prototype.infiniteScroll = function()
{
	console.info(window.scrollY);
}

/**
 * Triggered by infinite toggle changes in the settings module
 */
com.cdm.sports.PaginationManager.prototype.enableInfinite = function()
{
	//console.log('infinite scroll enabled');
}

/**
 * Triggered by infinite toggle changes in the settings module
 */
com.cdm.sports.PaginationManager.prototype.disableInfinite = function()
{
	//console.log('infinite scroll disabled');
}

/**
 * Triggered by infinite toggle changes in the settings module
 */
com.cdm.sports.PaginationManager.prototype.enableXhr = function()
{
	//console.log('ajax enabled');
	goog.dom.removeChildren(/** @type {Node} */( this.paginationWrapper ) );
	this.paginationWrapper.appendChild( this.buttonAncestor );
	this.enableInfinite();
}

/**
 * Triggered by infinite toggle changes in the settings module
 */
com.cdm.sports.PaginationManager.prototype.disableXhr = function()
{
	//console.log('ajax disabled');
	goog.dom.removeChildren(/** @type {Node} */( this.paginationWrapper ) );
	this.paginationWrapper.appendChild( this.paginationLinks );
	this.disableInfinite();
}