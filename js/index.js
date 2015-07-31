var publicKey = "dcf136c1ecec5f0a3adcf6dfd294573c";

var ractive = getComicsList("./json/comics.json", parseWeekDuration());
var navigationStack = [];

$(window).keydown(keyHandler);
function keyHandler(event)
{
	if (event.which == 8) // Backspace
	{
		if (ractive && navigationStack.length > 1)
		{
			navigationStack.pop();
			var lastPage = navigationStack[navigationStack.length - 1];
			lastPage.f.apply(undefined, lastPage.p);
			
			event.preventDefault();
		}
		
	}
}

function getComicsList (url, title) {
	//"http://gateway.marvel.com:80/v1/public/comics?format=comic&formatType=comic&noVariants=true&dateDescriptor=thisWeek&orderBy=onsaleDate&apikey="+publicKey;
	$.getJSON(url, function(data) {
		if (data && data.data && data.data.results)
		{
			Ractive.load('./partials/list.html').then(function (List) {
				navigationStack.push({ f: getComicsList, p: [url, title] });
				ractive = new List({
					el: 'main',
					data: {
						comics : data.data.results,
						title : title
					}
				});
				
				ractive.on({
					getComicDetails: getComicDetails
				});
			});
		}
	});
	return ractive;
}

function getComicDetails (event, value) 
{
	//"http://gateway.marvel.com:80/v1/public/comics/"+value+"?apikey="+publicKey;
	$.getJSON( "./json/" + value + ".json", function(data) {
		if (data && data.data && data.data.results)
		{
			Ractive.load('./partials/detail.html').then(function (Detail) {
				navigationStack.push({ f: getComicDetails, p: [event, value] });
				ractive = new Detail({
					el: 'main',
					data: { payload : data.data.results[0] }
				});
				
				ractive.on({
					purchaseComic: purchaseComic,
					getSeriesList: getSeriesList
				});
			});
		}
	});
	return ractive;
}

function getSeriesList (event, value)
{
	var uri = value.resourceURI.split("/");
	seriesId = uri[uri.length - 1];
	
	//"http://gateway.marvel.com:80/v1/public/series/"+seriesId+"/comics?format=comic&formatType=comic&noVariants=true&orderBy=onsaleDate&apikey="+publicKey;
	$.getJSON( "./json/" + seriesId + ".json", function(data) {
		if (data && data.data && data.data.results)
		{
			Ractive.load('./partials/list.html').then(function (List) {
				navigationStack.push({ f: getSeriesList, p: [event, value] });
				ractive = new List({
					el: 'main',
					data: {
						comics : data.data.results,
						title : value.name
					}
				});
				
				ractive.on({
					getComicDetails: getComicDetails
				});
			});
		}
	});
	return ractive;
}

function parseWeekDuration ()
{
	var currentDate = new Date();		
	var monday = currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() == 0 ? -6:1);
	var weekStart = new Date(currentDate.setDate(monday));
	var weekEnd = new Date(currentDate.setDate(monday + 6));
	
	return "New comics this week (" + $.format.date(weekStart, "E MMM D") + " - " + $.format.date(weekEnd, "E MMM D") + ")";
}

function parseImage (images)
{
	if (images)
	{
		for (var i = 0; i < images.length; i++)
		{
			if (images[i].path && images[i].extension)
				return images[i].path + "." + images[i].extension;
		}
	}
	return "";
}

function parsePrice (prices)
{
	if (prices)
	{
		for (var i = 0; i < prices.length; i++)
		{
			if (prices[i].price)
				return "$" + prices[i].price;
		}
	}
	return "";
}

function purchaseComic (event, value)
{
	if (value)
	{
		for (var i = 0; i < value.length; i++)
		{
			if (value[i].type)
			{
				window.location.href = value[i].url;
				return;
			}
		}
	}
	alert("This comic is not available right now.");
}