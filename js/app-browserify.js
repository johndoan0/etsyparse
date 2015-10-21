// es5 and 6 polyfills, powered by babel
require("babel/polyfill")

var $ = require('jQuery'),
	Backbone = require('backbone'),
	React = require('react'),
	Parse = require('parse')
let fetch = require('./fetcher')
console.log('javascript loaded')

var appId = "VU3sT0ZSGtJ2LUo0jcJshdehpMARz8ccbyinOxgG",
	jsKey = "QO8GTE9QEKNqTLzkN4BNT4dUNHltsTI3rWyKCs72",
	restapi = "nqG044EQcow5u8hiIAvY8CM83jSWrB8OiBYn39B0"

Parse.initialize(appId, jsKey);

window.jq = $

window.Parse = Parse

// === MODEL - single Etsy item 
var EtsyModel = Backbone.Model.extend({
	
	// url: 'https://openapi.etsy.com/v2/listings/active.js?api_key=aavnvygu0h5r52qes74x9zvo&includes=Images',
	url: 'https://openapi.etsy.com/v2/listings/',

	apikey: 'aavnvygu0h5r52qes74x9zvo',

	parse: function(responseData){
		console.log('model request', responseData.results[0])
		return responseData.results[0]
	}
})


// === COLLECTION - 25 items in array
var EtsyCollection = Backbone.Collection.extend({
	
	url:function(){
		return 'https://openapi.etsy.com/v2/listings/active.js?api_key=aavnvygu0h5r52qes74x9zvo&includes=MainImage'
	},
})


// === VIEW - view collection on #home route
var EtsyView = Backbone.View.extend({

	el: '#container',

	events: {
			"click #singleinfo"    : "etsyDetailsGoTo",
			"click #favoriteslist" : "displayFavoritesList"
	},

	etsyDetailsGoTo: function(event){
		var buttonEl = event.target,
			listEl = buttonEl.parentElement,
			singleEtsyItem = listEl.getAttribute('data-iditem')
		location.hash = `details/${singleEtsyItem}`
	},

	displayFavoritesList: function(event){
		console.log('FavsList clicked')
		location.hash = 'favslist'
	},

	displayTitleHome: function(){
		// console.log('view.dTH run')
		var self = this
		var listings = self.collection.models[0].attributes.results
		var titlesHtml = ''
		listings.forEach(function(listing){
			var itemImg = listing.MainImage.url_570xN
			var title = listing.title
			titlesHtml += `	<img src="${itemImg}">
							<div data-idItem="${listing.listing_id}">${title}
							<button type="button" id="singleinfo"}>i</button>
							</div>`
		})
		// console.log(titlesHtml)
		return titlesHtml
	},

	render: function(){
		console.log('view.render run')
		// console.log(this.collection)
		
		this.$el.html(
			`<button type="button" id="favoriteslist">See Your Favorites List!</button>
			</br></br>
			<div id="activelistings">${this.displayTitleHome()}</div>`
		)
	},

	initialize: function(){
		console.log('stuff in the collection', this.collection)
		this.listenTo(this.collection, "update", this.render)
		console.log('stuff in the group view', this)
		// this.render()
	}
})








// === VIEW - details on single Etsy item
var EtsySingleView = Backbone.View.extend({

	el: "#container",

	events: {"click #favbutton"  : "favButtonClick"},

	descriptionSingleItem: function(){return this.model.attributes.description},

	imagesSingleItem: function(){return this.model.attributes.Images[0].url_570xN},

	priceSingleItem: function(){return this.model.attributes.price},

	titleSingleItem: function(){return this.model.attributes.title},
	
	urlSingleItem: function(){return this.model.attributes.url},

	favButtonClick: function(event){
		// event.preventDefault()
		console.log('fav clicked', this.model.attributes)
		var AddToFavList = Parse.Object.extend("FavoritesList")
		var addToFavList = new AddToFavList()
		addToFavList.save(this.model.attributes).then(function(){alert('Saved to Favorites List!')})
	},

	displaySingleItem: function(){this.$el.html(
		`<div id=title>${this.titleSingleItem()}</div></br>
		<button type="button" id="favbutton"}>Save as Fav!</button>
		</br></br>
		<img id=images src=${this.imagesSingleItem()}></br></br>
		<div id=description>${this.descriptionSingleItem()}</div></br>
		<div id=price>Price: $ ${this.priceSingleItem()}</div></br>
		<div id=url>URL: <a href=${this.urlSingleItem()}>${this.urlSingleItem()}</a></div></br>`
		)
	},

	render: function(){
		console.log('stuff in the model', this.model)
		this.displaySingleItem()
	}
})

// === CONTROLLER/ROUTER
var EtsyRouter = Backbone.Router.extend({
	routes: {
		'home': 'homePage',
		'details/:idItem': 'detailsPage',
		'favslist': 'favoritesList', 
		'*anyroute': 'defaultPage'
	},

	defaultPage: function(){
		location.hash = 'home'
	},

	detailsPage: function(idItem){
		console.log('router.detailsPage')
		var self = this
		this.eModel.fetch({
			url: `https://openapi.etsy.com/v2/listings/${idItem}.js`,
			data: {
				api_key: this.eModel.apikey,
				includes: 'Images'
			},
			dataType: 'jsonp',
			processData: true
		}).done(function(){
			// console.log(self.eModel)
			self.eSingleView.render()
		})
	},

	homePage: function(){
		// console.log('router.homepage run')
		this.eCollection.fetch({
			data: {includes: 'MainImage'},
			dataType: 'jsonp'
		})
	},

	favoritesList: function(){
		var self = this
		var favQuery = new Parse.Query("FavoritesList")
		favQuery.find().then(function(favsList){console.log(favsList)})
	},

	initialize: function(){
		this.eModel = new EtsyModel
		this.eCollection = new EtsyCollection()
		this.eView = new EtsyView({collection: this.eCollection})
		console.log('stuff in the router', this)
		this.eCollection.state = 'empty'
		this.eSingleView = new EtsySingleView({model: this.eModel})
		this.fListView = new FavoritesListView({collection: this.fListCollection})
		Backbone.history.start()
	}
})


// // ====  Favorites List View
var FavoritesListView = Backbone.View.extend({
	// render: function(){console.log()}
})
 
// // ==== Favorites List Collection
// var FavoritesListCollection = Backbone.Collection.extend({
// 	// url: 
// })


var eRouter = new EtsyRouter()
