$(document).ready(function() {
	SetupHeaderMenu();
	CollapsibleSideNav();
	CopyPageURL();
	BackToTop();
	SearchBarToggle();
	HeadingBookmarks("h1,h2,h3");
	ClearSearch();
	HomeTileLinks();
	$("div.title-bar-container").after($(".toolbar-container"));
	$("div.toolbar-container, div.sidenav-container").show();
	$("div.search-bar-icon").prependTo("._Skins_Toolbar_Right ");
	$("div.search-wrapper").prependTo("._Skins_Toolbar_Right ");
});

/********* Setup Top Navigation Menu **********/
function SetupHeaderMenu() {
	// Move the header links menu into the title bar
	const headerMenuContainer = document.querySelector("div.header-links-menu");
	const titleBar = document.querySelector("div.title-bar-layout");
	if (headerMenuContainer && titleBar) {
		titleBar.appendChild(headerMenuContainer);
	}

	const MAX_RETRIES = 10;
	const RETRY_DELAY = 300;
	let retryAttempts = 0;

	function initializeMenu() {
		const headerMenu = document.querySelector('.nocontent.menu._Skins_Header_Menu');
		if (!headerMenu) return;

		// Add classes and aria attributes
		headerMenu.querySelectorAll('li').forEach(li => {
			const subMenu = li.querySelector('ul.sub-menu');
			if (!subMenu) return;
			li.classList.add('menu-drop-down');
			li.setAttribute('aria-haspopup', 'true');
			li.setAttribute('aria-expanded', 'false');
			subMenu.setAttribute('role', 'menu');
			subMenu.style.display = 'none';
		});

		// Remove any previous listeners
		headerMenu.removeEventListener('pointerover', pointerOverHandler);
		headerMenu.removeEventListener('pointerout', pointerOutHandler);
		headerMenu.removeEventListener('click', clickHandler);
		headerMenu.removeEventListener('keydown', keyDownHandler);
		document.removeEventListener('click', documentClickHandler);

		// State for mobile tap handling
		let lastTappedLi = null;
		let tapTimeout = null;

		// Delegated handlers
		headerMenu.addEventListener('pointerover', pointerOverHandler);
		headerMenu.addEventListener('pointerout', pointerOutHandler);
		headerMenu.addEventListener('click', clickHandler);
		headerMenu.addEventListener('keydown', keyDownHandler);
		document.addEventListener('click', documentClickHandler);

		function getMenuItemFromEvent(event) {
			return event.target.closest('li.menu-drop-down');
		}

		function showMenu(li) {
			if (!li) return;
			const subMenu = li.querySelector('ul.sub-menu');
			if (!subMenu) return;
			subMenu.style.display = 'block';
			li.setAttribute('aria-expanded', 'true');
			li.classList.add('open');
		}

		function hideMenu(li) {
			if (!li) return;
			const subMenu = li.querySelector('ul.sub-menu');
			if (!subMenu) return;
			subMenu.style.display = 'none';
			li.setAttribute('aria-expanded', 'false');
			li.classList.remove('open');
		}

		// Desktop hover
		function pointerOverHandler(e) {
			if (window.innerWidth <= 1024) return; // no hover on mobile
			const li = getMenuItemFromEvent(e);
			if (li) showMenu(li);
		}

		function pointerOutHandler(e) {
			if (window.innerWidth <= 1024) return;
			const li = getMenuItemFromEvent(e);
			if (li && !li.contains(e.relatedTarget)) hideMenu(li);
		}

		// Mobile + desktop click/tap
		function clickHandler(e) {
			const li = getMenuItemFromEvent(e);
			if (!li) return;
			const toggleLink = li.querySelector('a');
			if (!toggleLink || !toggleLink.contains(e.target)) return;

			if (window.innerWidth <= 1024) {
				const isOpen = li.classList.contains('open');

				if (!isOpen) {
					e.preventDefault();
					headerMenu.querySelectorAll('.menu-drop-down.open').forEach(openLi => {
						if (openLi !== li) hideMenu(openLi);
					});
					showMenu(li);
					lastTappedLi = li;

					clearTimeout(tapTimeout);
					tapTimeout = setTimeout(() => {
						tapTimeout = null;
					}, 300);
				} else {
					if (lastTappedLi === li) {
						if (tapTimeout) {
							e.preventDefault(); // block too-fast second tap
						} else {
							lastTappedLi = null; // allow navigation
						}
					} else {
						e.preventDefault();
						headerMenu.querySelectorAll('.menu-drop-down.open').forEach(openLi => {
							if (openLi !== li) hideMenu(openLi);
						});
						showMenu(li);
						lastTappedLi = li;
					}
				}
			}
		}

		function keyDownHandler(e) {
			const li = e.target.closest('li.menu-drop-down');
			if (!li) return;
			const subMenu = li.querySelector('ul.sub-menu');
			if (!subMenu) return;
			const toggleLink = li.querySelector('a');
			if (e.target !== toggleLink) return;

			const isVisible = subMenu.style.display === 'block';
			switch (e.key) {
				case 'Enter':
				case ' ':
					if (!isVisible) {
						e.preventDefault();
						showMenu(li);
					}
					break;
				case 'Escape':
					if (isVisible) {
						e.preventDefault();
						hideMenu(li);
						toggleLink.focus();
					}
					break;
				case 'ArrowDown':
					if (!isVisible) {
						e.preventDefault();
						showMenu(li);
					}
					const firstSubItem = subMenu.querySelector('a');
					if (firstSubItem) firstSubItem.focus();
					break;
				case 'ArrowUp':
					if (!isVisible) {
						e.preventDefault();
						showMenu(li);
					}
					const subItems = subMenu.querySelectorAll('a');
					if (subItems.length) subItems[subItems.length - 1].focus();
					break;
			}
		}

		function documentClickHandler(e) {
			headerMenu.querySelectorAll('.menu-drop-down.open').forEach(li => {
				if (!li.contains(e.target)) hideMenu(li);
			});
			lastTappedLi = null;
		}
	}

	// MutationObserver + polling fallback
	const observer = new MutationObserver(() => {
		const headerMenu = document.querySelector('.nocontent.menu._Skins_Header_Menu');
		if (headerMenu) {
			initializeMenu();
			observer.disconnect();
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	const pollForMenu = setInterval(() => {
		const headerMenu = document.querySelector('.nocontent.menu._Skins_Header_Menu');
		if (headerMenu || retryAttempts >= MAX_RETRIES) {
			clearInterval(pollForMenu);
			initializeMenu();
			observer.disconnect();
		} else {
			retryAttempts++;
		}
	}, RETRY_DELAY);

	// Re-initialize after idle/tab switch
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			initializeMenu();
		}
	});
}

/********* Collapsible Side Navigation **********/
function CollapsibleSideNav() {
	var ls = localStorage.getItem('collapsed');
	if (ls == "yes") {
		$(".sidenav-wrapper").hide();
		$(".collapse").addClass("expand");
	}
	if ($(".expand").length) {
		localStorage.setItem('collapsed', "yes");
	} else {
		localStorage.setItem('collapsed', "no");
	}
	$(".collapse").click(function() {
		$(".sidenav-wrapper").toggle(350);
		$(this).toggleClass("expand");
		var val = $(this).hasClass('expand') ? 'yes' : 'no';
		localStorage.setItem('collapsed', val);
	});
}

/********* Back to Top Button **********/
function BackToTop() {
	if ($(".body-container").length === 1) {
		var bodyContainer = $('.body-container')[0];
		var mybutton = document.createElement("button");
		var textnode = document.createTextNode("Top");
		mybutton.appendChild(textnode);
		mybutton.setAttribute("id", "myBtn");
		mybutton.addEventListener("click", topFunction);

		bodyContainer.appendChild(mybutton);

		// Both functions are used based on the responsive portion of the output
		bodyContainer.onscroll = function() {
			scrollFunction();
		};
		window.onscroll = function() {
			scrollFunctionx();
		};

		function scrollFunction() {
			if (bodyContainer.scrollTop > 20 || document.documentElement.scrollTop > 20) {
				mybutton.style.display = "block";
			} else {
				mybutton.style.display = "none";
			}
		}

		function scrollFunctionx() {
			if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
				mybutton.style.display = "block";
			} else {
				mybutton.style.display = "none";
			}
		}

		function topFunction() {
			$('html, body').animate({
				scrollTop: 0
			}, "smooth");
			$('html, documentElement').animate({
				scrollTop: 0
			}, "smooth");
			$('.body-container').animate({
				scrollTop: 0
			}, "smooth");
		}
	}
}


/********* Heading Bookmarks **********/
function HeadingBookmarks(selectors) {
	// Allow `selectors` to be a string, array, or jQuery object
	var elements = $(selectors);

	elements.each(function(i) {
		var heading = $(this);
		heading.addClass("bookmark-hotspot");
		var b = heading.attr("id");
		var bookmarked = heading.find("a[name]");
		var bookmarkID = bookmarked.attr("name");

		if (bookmarked.length) {
			heading.attr("id", bookmarkID);
			var anchor_url = window.location.href + "#" + bookmarkID;
			heading.prepend("<a class='heading-link' id='" + bookmarkID + "'  onClick='copyLink(id, event)' href='#' title='Copy link'><div id='anchor-icon' >&#160;&#160;</div></a>");
			var magellan = heading.attr("data-magellan-target");
			bookmarked.remove();
			if (bookmarkID !== magellan) {
				$("ul.menu li a[href='#" + magellan + "']").attr("href", "#" + bookmarkID);
			}
		} else if (b !== undefined) {
			var anchor_url = window.location.href + "#" + b;
			heading.prepend("<a class='heading-link' id='" + b + "'  onClick='copyLink(id, event)' href='#'><div id='anchor-icon' title='Copy link'>&#160;&#160;</div></a>");
			if (b !== magellan) {
				$("ul.menu li a[href='#" + magellan + "']").attr("href", "#" + b);
			}
		} else {
			b = heading.text()
				.toLowerCase()
				.trim()
				.replace(/\s+/g, "-")
				.replace(/&/g, "-and-")
				.replace(/[^\w\-]+/g, "")
				.replace(/\-\-+/g, "-");
			heading.attr("id", b);
			var anchor_url = window.location.href + "#" + b;
			heading.prepend("<a class='heading-link' id='" + b + "'  onClick='copyLink(id, event)' href='#'><div id='anchor-icon' title='Copy link'>&#160;&#160;</div></a>");
		}

		heading.find(".heading-link").click(function() {
			window.location.href = anchor_url;
			heading.addClass("active");
			setTimeout(function() {
				heading.removeClass("active");
			}, 700);
		});

		setTimeout(function() {
			var url = window.location.href;
			var hash = url.substring(url.indexOf("#") + 1);
			if (url.indexOf("#") > -1) {
				// Uncomment if smooth scroll is needed
				$("html, body,.body-container").animate({
					scrollTop: $("#" + hash).offset().top - 120
				}, 200);
			}
		}, 200);
	});
}

// Function to copy the link to the clipboard
function copyLink(evt, event) {
	event.preventDefault();
	var noHash = location.href.replace(location.hash, "");
	navigator.clipboard.writeText(noHash + "#" + evt).then(() => {
		console.log("Copied to clipboard!");
	}, () => {
		console.error("Failed to copy link.");
	});
}



/******** Copy Page URL *********/
function CopyPageURL() {
	$(".copy-link-button").click(function() {
		// Create a temporary input element to hold the current URL
		var $tempInput = $("<input>");
		$("body").append($tempInput);

		// Set the value of the input to the current URL
		$tempInput.val(window.location.href).select();

		// Copy the selected text to the clipboard
		document.execCommand("copy");

		// Remove the temporary input element
		$tempInput.remove();

		$(this).attr("title", "Copied");
	});
}

/********  Search Bar Toggle *********/
function SearchBarToggle() {
	const STORAGE_KEY = "searchBarVisible";

	function isMobile() {
		return $(window).width() < 767;
	}

	function setSearchBarVisible(visible, animate = true) {
		const $searchWrapper = $(".search-wrapper");
		const $toolbar = $(".toolbar-container");

		if (visible) {
			if (animate && !isMobile()) {
				$searchWrapper.slideDown(170);
			} else {
				$searchWrapper.show();
			}
			$toolbar.addClass("mobile-active");
			sessionStorage.setItem(STORAGE_KEY, "true");
		} else {
			if (animate && !isMobile()) {
				$searchWrapper.slideUp(170);
			} else {
				$searchWrapper.hide();
			}
			$toolbar.removeClass("mobile-active");
			sessionStorage.setItem(STORAGE_KEY, "false");
		}
	}

	// Load previous visibility state
	const savedState = sessionStorage.getItem(STORAGE_KEY);
	if (savedState === "true") {
		setSearchBarVisible(true, false);
	}

	const $icon = $(".search-bar-icon");

	function toggleSearchBar() {
		$(".tooltip").remove();
		const isVisible = $(".toolbar-container").hasClass("mobile-active");
		setSearchBarVisible(!isVisible);
	}

	// Mouse click
	$icon.on("click", toggleSearchBar);

	// Keyboard activation
	$icon.on("keydown", function(e) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault(); // Prevent page scroll for space
			toggleSearchBar();
		}
	});
}

/********* Clear Search **********/
function ClearSearch() {
	$(".search-filter-wrapper").before("<span class='clear-icon' title='Clear search'>x</span>");
	var search_button = setInterval(function() {
		if ($(".search-field").val().length > 0) {
			$(".clear-icon").show();
			$("ul#searchResultsDropdown").show();
		}
		clearInterval(search_button);
	}, 100);
	$(".search-field").keyup(function() {
		if ($(this).val().length == 0) {
			$(".clear-icon").hide();
			$("ul#searchResultsDropdown").hide();
		} else {
			$(".clear-icon").show();
			$("ul#searchResultsDropdown").show();
		}
	}).keyup();
	$(".clear-icon").click(function() {
		$(this).prev('input').val('').trigger('change').focus();
		$(".clear-icon").hide();
		$("ul#searchResultsDropdown").hide();
	});
};

/********* Home Tile Links **********/

function HomeTileLinks() {
	if ($("html").hasClass("home-topic")) { // check to see if on home page
		$("div.home-tiles > div").each(function() {
			var tileLink = $(this).find("a").attr("href"); // find links inside of home tiles
			$(this).attr("onclick", "window.location.href='" + tileLink + "'"); // set link href value as onclick attribute for the div so the entire tile is clickable
		});
	} else {
		return; // if not on home page do nothing
	}
}

function hideToolbarInPreview() {
    // Convert pathname to lowercase for comparison
    var path = location.pathname.toLowerCase();

    // Check if path contains the Flare Preview temp folder
    var isPreview = path.includes("/appdata/local/temp/");

    if (isPreview) {
        // Wait until the toolbar is in the DOM
        var checkToolbar = setInterval(function () {
            var toolbar = document.querySelector("div.toolbar-container");
            if (toolbar) {
                toolbar.style.display = "none";
                clearInterval(checkToolbar);
            }
        }, 50);
    }
}

// Run after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideToolbarInPreview);
} else {
    hideToolbarInPreview();
}