(function () {
    var map;
    var product = $('body').data('product');
    var chart_container = 'map-chart';
    var $date_pattern = $('.date-pattern');
    var default_format = 'EEEE, dd MMMM yyy';
    var timeZoneOffset = new Date().getTimezoneOffset();
    formats = {};

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow', function () {
            scrollPosition();
        });
    }

    function activeEl(el) {
        $(el).closest('table').find('td').removeClass('active');
        $(el).addClass('active');
    }

    function getLocaleText() {
        $.ajax({
            url: 'http://cdn.anychart.com/locale/1.1.0/index.json',
            success: function (json) {
                var data = json;
                var $table = $('.language-locale').find('tbody');
                var locale;

                data['anychart-locales'].locales.sort(function (a, b) {
                    return a['englishName'].localeCompare(b['englishName']);
                });

                for (var i = 0; i < data['anychart-locales'].locales.length; i++) {
                    locale = data['anychart-locales'].locales[i];
                    $table.append(
                        '<tr>' + '<td data-locale-src="' + locale.url +
                        '" data-code="' + locale.code +
                        '">' + locale.englishName + ' - ' + locale.nativeName +
                        '</td>' + '</tr>'
                    )
                }

                askEventLanguageLocale();
                $table.find('td[data-code="en-us"]').trigger('click');
            }
        });
    }

    function getDateTimePattern(code) {
        var url = 'formats/' + code + '.js';

        loadScript(url, changePattern, code);
    }

    function changePattern(code) {
        var $table = $date_pattern.find('tbody');
        $table.empty();

        for (var i = 0; i < formats[code].length; i++) {
            $table.append(
                '<tr>' + '<td>' + formats[code][i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var $body = $('body');
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';

        script.src = url;

        if ($(el).length === 0) {
            $(script).attr('defer', 'defer');
            $body.find('#js_common').before(script);
        }
        script.onload = callback(code);

        displayLocaleJSON(url);
        displayFormatArray(url, code);
        displayFullSource(code);
    }

    function displayLocaleJSON(url) {
        if (url.indexOf('formats') === -1) {
            $.ajax({
                url: url,
                success: function (source) {
                    var code = JSON.stringify(eval(source), null, '\t');
                    var $lang_json = $('#locale-json').find('.language-json');

                    $lang_json.text(code);
                    Prism.highlightElement($lang_json[0]);
                }
            });
        }
    }

    function displayFormatArray(url, code) {
        if (url.indexOf('formats') !== -1) {
            var $lang_js = $('#format-array').find('.language-javascript');
            var text = 'var formats = {};\n' + 'formats' + '[\'' + code + '\'] = ';
            var formats_text = formats[code].map(function (value, index) {
                if (index == 0) {
                    return '"' + value + '"'
                }
                return '\t\t\t\t\t"' + value + '"'
            });

            $lang_js.text(text + '[' + formats_text.join(',\n') + ']');
            Prism.highlightElement($lang_js[0]);
        }
    }

    function displayFullSource(locale, input_format) {
        var $lang_mark = $('.language-markup');
        var format = input_format || $date_pattern.find('td.active').text() || default_format;
        var code_func = createChart.toString()
            .replace('function createChart(container, locale, format) {', '')
            .replace(/}$/, '')
            .trim();
        var code = 'anychart.onDocumentReady(function () {' +
            '\n\t\tvar format ="' + format + '";\n' +
            '\t\tvar locale = "' + locale + '";\n' +
            '\t\tvar timeZoneOffset = new Date().getTimezoneOffset();\n\t\t' +
            code_func + '\n\t\t});';
        var doc = '<!DOCTYPE html>\n<html lang="en">\n<head>' +
            '\n\t<meta charset="utf-8" />' +
            '\n\t<script src="http://cdn.anychart.com/geodata/1.2.0/custom/world/world.js"></script>' +
            '\n\t<script src="https://cdn.anychart.com/js/7.14.3/anychart-bundle.min.js"></script>' +
            '\n\t<script src="' + 'https://cdn.anychart.com/locale/1.1.0/' + locale + '.js"></script>' +
            '\n</head>\n<body>' +
            '\n\t<div id="container" style="width: 850px; height: 600px; margin: 0 auto;"></div>' +
            '\n\t<script>\n\t\t' + code +
            '\n\t</script>\n</body>\n</html>';

        $lang_mark.text(doc);
        Prism.highlightElement($lang_mark[0]);
    }

    function disposeChart() {
        if (map) {
            map.dispose();
            map = null;
        }
    }

    function changeLocale(code) {
        if (typeof code === 'string') {
            if (anychart.format.outputLocale() != code) {
                var timerId = setInterval(reDrawChart, 50);
            }
        }

        function reDrawChart() {
            if (window['anychart']['format']['locales'][code] != undefined) {
                var format = $date_pattern.find('td.active').text() || default_format;

                clearInterval(timerId);
                disposeChart();
                createChart(chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format, flag) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(chart_container, locale, format);
        changeInputFormat(format, flag);
        displayFullSource(locale, format);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            getDateTimePattern(code);
            activeEl($that);
        });
    }

    function askEventDatePattern() {
        $date_pattern.find('td').on('click', function () {
            var $that = $(this);

            activeEl($that);
            changeInputPattern($that.text());
            changeDatePattern($that.text());
        });
    }

    function changeInputPattern(pattern) {
        $('.format-pattern-input').val(pattern);
    }

    function changeInputFormat(format, flag) {
        var locale = anychart.format.outputLocale();
        var date = new Date();
        var pattern = anychart.format.dateTime(date, format, timeZoneOffset, locale);

        if (flag === undefined) {
            $('.format-input').val(pattern);
        } else {
            $('#custom-example-format-input').val(pattern)
        }
    }

    function createChart(container, locale, format) {
        // set a localization for output.
        anychart.format.outputLocale(locale);
        anychart.format.outputDateTimeFormat(format);

        var data = [
            {id: "AF", name: "Afghanistan", size: 7.5, date: '26 October 2015', description: 'Hindu Kush earthquake'},
            {id: "DZ", name: "Algeria", size: 7.7, date: '10 October 1980', description: 'El Asnam earthquake'},
            {id: "AR", name: "Argentina", size: 8.0, date: '27 October 1894', description: 'San Juan earthquake'},
            {id: "AU", name: "Australia", size: 7.2, date: '29 April 1941', description: ''},
            {id: "BD", name: "Bangladesh", size: 8.8, date: '2 April 1762', description: 'Arakan earthquake'},
            {id: "BE", name: "Belgium", size: 6.3, date: '18 September 1692', description: ''},
            {id: "BO", name: "Bolivia", size: 8.5, date: '9 May 1877', description: 'Iquique earthquake'},
            {id: "BR", name: "Brazil", size: 6.2, date: '31 January 1955', description: ''},
            {id: "BG", name: "Bulgaria", size: 7.8, date: '4 April 1904', description: ''},
            {id: "CA", name: "Canada", size: 8.9, date: '26 January 1700', description: 'Cascadia earthquake'},
            {id: "CN", name: "China", size: 8.6, date: '15 August 1950', description: 'Assam–Tibet earthquake'},
            {id: "CL", name: "Chile", size: 9.5, date: '22 May 1960', description: 'Valdivia earthquake'},
            {id: "CO", name: "Colombia", size: 8.8, date: '31 January 1906', description: 'Ecuador–Colombia earthquake'},
            {id: "CU", name: "Cuba", size: 6.8, date: '11 June 1766', description: ''},
            {id: "DK", name: "Denmark", size: 4.3, date: '16 December 2008', description: ''},
            {id: "DO", name: "Dominican Republic", size: 8.1, date: '4 August 1946', description: 'Dominican Republic earthquake'},
            {id: "EC", name: "Ecuador", size: 8.8, date: '31 January 1906', description: 'Ecuador–Colombia earthquake'},
            {id: "EG", name: "Egypt", size: 7.3, date: '22 November 1995', description: 'Gulf of Aqaba earthquake'},
            {id: "EE", name: "Estonia", size: 4.5, date: '25 October 1976', description: ''},
            {id: "FI", name: "Finland", size: 3.5, date: '21 February 1989', description: ''},
            {id: "FR", name: "France", size: 6.2, date: '11 June 1909', description: 'Provence earthquake'},
            {id: "DE", name: "Germany", size: 6.1, date: '18 February 1756', description: ''},
            {id: "GR", name: "Greece", size: 8.5, date: '21 July 365', description: 'Crete earthquake'},
            {id: "GT", name: "Guatemala", size: 7.7, date: '6 August 1942', description: 'Guatemala earthquake'},
            {id: "HT", name: "Haiti", size: 8.1, date: '7 May 1842', description: 'Cap-Haitien earthquake'},
            {id: "IS", name: "Iceland", size: 6.6, date: '17 June 2000', description: 'Iceland earthquakes'},
            {id: "IN", name: "India", size: 8.6, date: '15 August 1950', description: 'Assam–Tibet earthquake'},
            {id: "ID", name: "Indonesia", size: 9.2, date: '26 December 2004', description: 'Boxing Day earthquake'},
            {id: "IR", name: "Iran", size: 7.9, date: '22 December 856', description: 'Damghan earthquake'},
            {id: "IT", name: "Italy", size: 7.4, date: '11 January 1693', description: 'Sicily earthquake'},
            {id: "JP", name: "Japan", size: 9.0, date: '11 March 2011', description: 'Tōhoku earthquake'},
            {id: "LB", name: "Lebanon", size: 7.5, date: '9 July 551', description: 'Beirut earthquake'},
            {id: "MY", name: "Malaysia", size: 6.0, date: '5 June 2015', description: 'Sabah earthquake'},
            {id: "MX", name: "Mexico", size: 8.6, date: '28 March 1787', description: 'Mexico earthquake'},
            {id: "MN", name: "Mongolia", size: 8.4, date: '23 July 1905', description: 'Bolnai earthquake'},
            {id: "ME", name: "Montenegro", size: 7, date: '15 April 1979', description: 'Montenegro earthquake'},
            {id: "NP", name: "Nepal", size: 8, date: '15 January 1934	', description: 'Nepal–Bihar earthquake'},
            {id: "NL", name: "Netherlands", size: 5.3, date: '13 April 1992', description: 'Roermond earthquake'},
            {id: "NZ", name: "New Zealand", size: 8.3, date: '23 January 1855', description: 'Wairarapa earthquake'},
            {id: "NI", name: "Nicaragua", size: 7.7, date: '2 September 1992', description: 'Nicaragua earthquake'},
            {id: "KP", name: "North Korea", size: 6.5, date: '19 March 1952', description: ''},
            {id: "NO", name: "Norway", size: 6.2, date: '19 February 2004', description: 'Svalbard earthquake'},
            {id: "PK", name: "Pakistan", size: 8.1, date: '28 November 1945', description: 'Balochistan earthquake'},
            {id: "PE", name: "Peru", size: 8.6, date: '28 October 1746', description: 'Lima–Callao earthquake'},
            {id: "PH", name: "Philippines", size: 8.3, date: '15 August 1918', description: 'Celebes Sea earthquake'},
            {id: "PL", name: "Poland", size: 5.4, date: '31 December 1999', description: ''},
            {id: "PT", name: "Portugal", size: 8.7, date: '1 November 1755', description: '1755 Lisbon earthquake'},
            {id: "RO", name: "Romania", size: 7.9, date: '26 October 1802', description: 'Vrancea earthquake'},
            {id: "RU", name: "Russia", size: 9.0, date: '4 November 1952', description: 'Kamchatka earthquake'},
            {id: "WS", name: "Samoa", size: 8.5, date: '26 June 1917', description: 'Samoa earthquake'},
            {id: "ZA", name: "South Africa", size: 6.3, date: '29 September 1969', description: ''},
            {id: "ES", name: "Spain", size: 7.0, date: '21 March 1954', description: ''},
            {id: "SE", name: "Sweden", size: 4.7, date: '15 September 2014', description: ''},
            {id: "CH", name: "Switzerland", size: 6.5, date: '18 October 1356', description: 'Basel earthquake'},
            {id: "TW", name: "Taiwan", size: 7.6, date: '21 September 1999', description: '921 earthquake'},
            {id: "TH", name: "Thailand", size: 6.3, date: '5 May 2014', description: 'Mae Lao earthquake'},
            {id: "TR", name: "Turkey", size: 7.8, date: '27 December 1939', description: 'Erzincan earthquake'},
            {id: "GB", name: "United Kingdom", size: 6.1, date: '7 June 1931', description: 'Dogger Bank earthquake'},
            {id: "US", name: "United States", size: 9.2, date: '27 March 1964', description: 'Alaska earthquake'},
            {id: "VE", name: "Venezuela", size: 7.5, date: '26 March 1812', description: 'Caracas earthquake'},
            {id: "VN", name: "Vietnam", size: 6.8, date: '24 June 1983', description: 'Tuan Giao earthquake'}
        ];

        data.sort(function (a, b) {
            return new Date(a['date']).getTime() - new Date(b['date']).getTime();
        });
        
        // creates data set
        var dataSet = anychart.data.set(data);

        var _title = 'Strongest Earthquakes by Country\n' + 'From: ' +
            anychart.format.dateTime(data[0].date, format, timeZoneOffset, locale) +
            '\nTo: ' + anychart.format.dateTime(data[data.length - 1].date, format, timeZoneOffset, locale);

        // creates Map Chart
        map = anychart.map();
        // sets geodata using http://cdn.anychart.com/geodata/world/world.js
        map.geoData(anychart.maps.world);

        var credits = map.credits();
        credits.enabled(true);
        credits.url('//en.wikipedia.org/wiki/Lists_of_earthquakes');
        credits.text('Data source: http://en.wikipedia.org/wiki/Lists_of_earthquakes');
        credits.logoSrc('//en.wikipedia.org/static/favicon/wikipedia.ico');

        // sets Chart Title
        map.title().text(_title).enabled(true).padding([20, 0, 0, 0]);
        map.interactivity().selectionMode(false);
        // sets bubble max size settings
        map.minBubbleSize(3);
        map.maxBubbleSize(15);

        // creates bubble series
        var series = map.bubble(dataSet);
        // sets series geo id field settings
        series.geoIdField("iso_a2");
        // sets series settings
        series.labels().enabled(false);
        series.fill("#ff8f00 0.6");
        series.stroke("1 #ff6f00 0.9");
        series.hoverFill("#78909c");
        series.hoverStroke("1 #546e7a 1");

        // sets tooltip
        var tooltipSettings = {
            background: {fill: 'white', stroke: '#c1c1c1', corners: 3, cornerType: 'ROUND'},
            padding: [8, 13, 10, 13]
        };
        series.tooltip(tooltipSettings);
        series.tooltip().textWrap('byLetter').useHtml(true);
        series.tooltip().title().fontColor('#7c868e');

        series.tooltip().format(function () {
            var span_for_value = '<span style="color: #545f69; font-size: 12px; font-weight: bold">';
            var span_for_date = '<br/><span style="color: #7c868e; font-size: 11px">';
            var span_for_description = '<br/><span style="color: #7c868e; font-size: 12px; font-style: italic">"';
            if (this.getData('description') != '')
                return span_for_value + this.size + 'M </span></strong>'
                    + span_for_description + this.getData('description') + '"</span>'
                    + span_for_date + anychart.format.dateTime(this.getData('date'), format, timeZoneOffset, locale) + '</span>';
            else
                return span_for_value + this.size + 'M </span></strong>'
                    + span_for_date + anychart.format.dateTime(this.getData('date'), format, timeZoneOffset, locale) + '</span>';
        });

        // set container id for the chart
        map.container(container);

        // initiate chart drawing
        map.draw();
    }

    anychart.onDocumentReady(function () {
        // event
        $('.tabs-control a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        $('#custom-format').find('.format-pattern-input').on('keyup', function () {
            changeDatePattern($(this).val(), true);
        });

        getLocaleText();
    });

    $(window).on('load', function () {
        hidePreloader();
    });

    function scrollPosition() {
        var $language_locale = $('.language-locale');
        var top = $language_locale.find('.active').position().top - $language_locale.height() / 2 + $language_locale.find('.active').height() / 2;

        $language_locale.animate({
            scrollTop: top
        }, 500);
    }

    /* Prism copy to clipbaord */
    $('pre.copytoclipboard').each(function () {
        $this = $(this);
        $button = $('<button></button>');
        $this.wrap('<div/>').removeClass('copytoclipboard');
        $wrapper = $this.parent();
        $wrapper.addClass('copytoclipboard-wrapper').css({position: 'relative'});
        $button.css({
            position: 'absolute',
            top: 10,
            right: 27,
            width: 55,
            height: 31
        }).appendTo($wrapper).addClass('copytoclipboard btn btn-default');

        var copyCode = new Clipboard('button.copytoclipboard', {
            target: function (trigger) {
                return trigger.previousElementSibling;
            }
        });
        copyCode.on('success', function (event) {
            event.clearSelection();
            $(event.trigger).addClass('copied');
            window.setTimeout(function () {
                $(event.trigger).removeClass('copied');
            }, 2000);
        });
        copyCode.on('error', function (event) {
            event.trigger.textContent = 'Press "Ctrl + C" to copy';
            window.setTimeout(function () {
                event.trigger.textContent = 'Copy';
            }, 2000);
        });
    });
})();
