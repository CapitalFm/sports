/**
 * The open article.  
 */
goog.provide('com.cdm.sports.Article');

goog.require( 'goog.dom' );
goog.require( 'goog.dom.selection' );
goog.require( 'goog.events.EventTarget' );
goog.require( 'goog.net.XhrManager' );
goog.require( 'goog.structs.Map' );
goog.require( 'goog.Uri.QueryData');
goog.require( 'goog.Uri' );



/**
 * @param {string} permalink 
 * @param {Array} cache 
 * @constructor
 * @extends {goog.events.EventTarget}
 */
com.cdm.sports.Article = function( permalink, cache  )
{
	
	this.permalink = permalink ;
	
	//console.log( cache );
	
	this.cache = cache;
	
	this.section = cdm['settings']['siteslug'];
	
	this.xhrBusy = false;
	
}


goog.inherits( com.cdm.sports.Article, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.Article.EventType = {
  OPEN: 'open',
  CLOSE: 'close',
  NOTFOUND: 'notfound',
  ERROR: 'error',
  FORBIDDEN: 'forbidden',
  CONNECTIONERROR: 'connectionerror',
  NOTARTICLE: 'notarticle'
};

com.cdm.sports.Article.prototype.close = function()
{
	this.dispatchEvent( com.cdm.sports.Article.EventType.CLOSE );
}

com.cdm.sports.Article.prototype.init_ = function()
{
	
	//console.log( {'article-permalink':this.permalink} );
	/**
	 * If the permalink is empty break the whole process
	 */
	if( '' == this.permalink )
	{
		this.dispatchEvent( com.cdm.sports.Article.EventType.ERROR );
		
		return;
	}
	
	
	var data,
	
	debug = cdm['settings']['debug'];
	
	//console.log( baseurl );
	
	this.ajaxurl = !debug ? [cdm['settings']['baseurl'],this.section,'wp-admin','admin-ajax.php'].join('/') : cdm.ajaxurl;
	
	
	if( 'undefined' == typeof this.cache[ this.permalink ] )
	{
		this.fetch();	
		
	}else
	{
		data = this.cache[ this.permalink ];
				
		this.postID = data[4];
		
		this.pageTitle = data[0];
		//console.log(data);
		
		this.generateHtml( data )
		
		this.dispatchEvent( com.cdm.sports.Article.EventType.OPEN );
	}
	
}
/**
 * @type {string}
 */
com.cdm.sports.Article.prototype.permalink = '';

/**
 * @type {string}
 */
com.cdm.sports.Article.prototype.pageTitle = '';

/**
 * @type {Element | null}
 */
com.cdm.sports.Article.prototype.html = null;


/**
 * @type {number}
 */
com.cdm.sports.Article.prototype.postID = 0;

/**
 * @type {boolean}
 */
com.cdm.sports.Article.prototype.hasDisqus = false;

/**
 * @type {string}
 */
com.cdm.sports.Article.prototype.generalHTML = cdm['templates']['generalarticle'];

/**
 * @type {string}
 */
com.cdm.sports.Article.prototype.opedHTML = cdm['templates']['opedarticle'];

/**
 * @type {string}
 */
com.cdm.sports.Article.prototype.queryHook = cdm['hooks']['single'];

/**
 * 
 */
com.cdm.sports.Article.prototype.fetch = function()
{
	if( this.xhrBusy )
	{
		return false;
	}
	
	this.xhrBusy = true;
	
	
	var data = goog.Uri.QueryData.createFromMap(
		new goog.structs.Map
		({
			'action':this.queryHook,
			'permalink':this.permalink,
			'nonce':com.cdm.sports.PageManager.nonces.single
		})
	).toString();
	this.xhrManager.send( this.permalink, this.ajaxurl, 'POST', data, null, 1, goog.bind( this.processFeedback, this ) );
	
	
};

com.cdm.sports.Article.prototype.processFeedback = function( e )
{
	this.xhrBusy = false;
	
	var xhr = e.target,
	
	error = xhr.getLastErrorCode();
	
	//console.log(error)
	
	if( ! error)
	{
		var response = xhr.getResponseJson(),
		
		payload = response['payload'];		
		
		if( response == 0 )
		{
			console.info( cdm['messages']['xhrnotconfigured'] );
			
			this.dispatchEvent( com.cdm.sports.Article.EventType.ERROR );
			
			return;
		}
		
		if(response['status']==200)
		{
			this.pageTitle = payload[ 0 ];
			
			this.postID = payload[4];
			
			this.generateHtml( payload );
			
			this.cache[ this.permalink ] = payload;			
			
			this.dispatchEvent( com.cdm.sports.Article.EventType.OPEN );
						
			
		}else if(response['status']==403)
		{
			this.dispatchEvent( com.cdm.sports.Article.EventType.FORBIDDEN );
		}
		else
		{
			this.dispatchEvent( com.cdm.sports.Article.EventType.NOTFOUND );
		}
		
		
	}else if( error == 6 )
	{
		this.dispatchEvent( com.cdm.sports.Article.EventType.NOTFOUND );
	}
	else if( error == 9 )
	{
		this.dispatchEvent( com.cdm.sports.Article.EventType.CONNECTIONERROR );
	}else
	{
		this.dispatchEvent( com.cdm.sports.Article.EventType.ERROR );
	}
	
}
/**
 * @type {goog.net.XhrManager}
 */
com.cdm.sports.Article.prototype.xhrManager = new goog.net.XhrManager;


com.cdm.sports.Article.prototype.generateHtml = function( data )
{
	var contentEl, 
	
	captions,
	
	caption,
	
	html = this.generalHTML,
	
	postID,
		
	title,
	
	htmlstr,
	
	date,
	
	author,
	
	authormeta,
	
	game,
	
	breadcrumb,
	
	permalink;
	
	postID = data[4];
		
	title = data[0];
	
	htmlstr = data[1];
	
	date = data[2];
	
	author = data[3];
	
	game = data[6];
	
	breadcrumb = data[7];
	
	permalink = data[5];
	
	authormeta = data[8];
	
	html = html.replace(/%title%/gi,title);
	html = html.replace( /%author%/gi, author );
	html = html.replace( /%reltime%/gi, date[1] );
	html = html.replace( /%dateposted%/gi, date[0] );
	html = html.replace( '%thecontent%', htmlstr );
	html = html.replace( /%avatar%/gi, authormeta[0] );
	html = html.replace( /%bio%/gi, '' );
	html = html.replace( /%permalink%/gi, permalink );
	html = html.replace( /%sporttype%/gi, game );
	html = html.replace( /%breadcrumb%/gi, breadcrumb );
	
	html = html.replace( /%authornetworks%/gi, authormeta[2] );
	html = html.replace( /%authordescription%/gi, authormeta[1] );
	
	html = html.replace( '%sidebar%', cdm['templates']['sidebar'] );
	html = html.replace( '%sidead1%', cdm['templates']['sidead1'] );
	html = html.replace( '%sidead2%', cdm['templates']['sidead2'] );
	
	//console.log(html);
	
	this.html = goog.dom.createDom('div', null,
		goog.dom.htmlToDocumentFragment( html )
	)
	
	return;
	
	//captions = goog.dom.getElementsByTagNameAndClass( 'div', 'wp-caption', this.html );
	//if(captions.length)
	//{
		//caption = captions[0];
		
		//goog.dom.insertSiblingAfter(/** @type {Node} */(this.generateShareButtons( 'top hidden-xs' )),/** @type {Node} */(caption));
		
	//}else
	//{
		//var paragraphs =  goog.dom.getElementsByTagNameAndClass( 'p', null, this.html ), paragraph;
		//if(paragraphs.length > 5)
		//{
			//paragraph = paragraphs[1]; //Out target is the second paragraph. *Hint: zero indexed array;
			
			//goog.dom.insertSiblingAfter(/** @type {Node} */(this.generateShareButtons( 'top ' )),/** @type {Node} */(paragraph));
			
		//}
	//}
	
	//return;
}
/**
 * @param {string} cssclass
 * @return {Element}
 */
com.cdm.sports.Article.prototype.generateShareButtons = function( cssclass )
{
	var shareItemCss = 'network',
	/**
	* @param {Array.<string>} classes
	*/
	stringCss = function(classes)
	{
		return classes.join(' ');
	}
	
	
	var plusone = goog.dom.createDom('g:plusone');
	plusone.setAttribute('href', this.permalink );
	plusone.setAttribute('size', 'standard' );
	plusone.setAttribute('annotation', 'bubble');
	plusone.setAttribute('action', 'share');
	
	var twitter = goog.dom.createDom('a',{'class':'twitter-share-button'});
	twitter.setAttribute('data-url',this.permalink );//this.articleTitle
	twitter.setAttribute('data-text', this.pageTitle );
	twitter.setAttribute('data-via', cdm.settings.twitteraccount );
	
	var facebook = goog.dom.createDom('div',{'class':'fb-like'});
	facebook.setAttribute('data-url', this.permalink );
	facebook.setAttribute('data-href', this.permalink );
	facebook.setAttribute('data-send', 'false' );
	facebook.setAttribute('data-layout', 'button_count' );
	facebook.setAttribute('data-width', '69' );
	facebook.setAttribute('data-show-faces', 'false' );
	facebook.setAttribute('data-action', 'recommend' );
	facebook.setAttribute('data-font', 'verdana' );
	
	var linkedin = goog.dom.createDom('script',{'class':'linkedin-share-button'});
	linkedin.setAttribute('type', 'IN/Share' );
	linkedin.setAttribute('data-url', this.permalink );
	linkedin.setAttribute('data-counter', 'right' );
	
	
	
	var sharerEl = goog.dom.createDom('div',{'class': stringCss([cssclass,'clearfix','sharer','clear'])},
		goog.dom.createDom( 'span', {'class': stringCss( [ 'twitter', shareItemCss ] ) }, twitter ),
		goog.dom.createDom( 'span', {'class': stringCss( [ 'plusone', shareItemCss ] ) }, plusone ),
		goog.dom.createDom( 'span', {'class': stringCss( [ 'linkedin', shareItemCss ] ) }, linkedin ),
		goog.dom.createDom( 'span', {'class': stringCss( [ 'facebook', shareItemCss ] ) }, facebook )
	)
	
	return sharerEl;
}
/**
 * @return {Element}
 */
com.cdm.sports.Article.prototype.generateCommentArea = function()
{
	//console.log(this.section);
	if( 'disqus'== cdm['settings']['comments'][this.section] )
	{
		this.hasDisqus = true;
		
		return goog.dom.createDom('div', {'id':'disqus_thread'});		
	}
	return goog.dom.createDom('div', {'class':'fb-comments','data-href':this.permalink,'data-width':'600'});
}