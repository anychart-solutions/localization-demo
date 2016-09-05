(function () {
    var chart;
    var text_doc = document.documentElement.innerHTML;
    var array_url = [];
    var chart_container = 'acme-chart';
    formats = {};

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow');
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
            }
        });
    }

    function getDateTimePattern(code) {
        var url = 'formats/' + code + '.js';

        loadScript(url, changePattern, code);
    }

    function changePattern(code) {
        var $table = $('.date-pattern').find('tbody');
        $table.empty();

        for (var i = 0; i < formats[code].length; i++) {
            $table.append(
                '<tr>' + '<td>' + formats[code][i] + '</td>' + '</tr>'
            );
        }

        askEventDatePattern();
    }

    function loadScript(url, callback, code) {
        var body = $('body')[0];
        var script = document.createElement('script');
        var el = 'script[src="' + url + '"]';
        array_url.unshift(url);
        script.src = url;

        if ($(el).length == 0) {
            body.appendChild(script);
        }

        if (callback.name === 'changeLocale') {
            script.onload = callback(code);
        } else if (callback.name === 'changePattern') {
            var done = false;
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState ||
                    this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;

                    callback(code);
                    displayFormatArray(url, code);
                    displayFullSource(array_url);
                }
            };
        }

        displayLocaleJSON(url);
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

    function displayFullSource(url) {
        var $lang_mark = $('.language-markup');
        var new_text_doc = text_doc.substr(0, text_doc.indexOf('</body>'));

        for (var i = 0; i < array_url.length; i++) {
            if (new_text_doc.indexOf(url[i]) == -1) {
                new_text_doc += '\n';
                new_text_doc += '<script src="' + url[i] + '">' + '</script>';
            }
        }

        new_text_doc += '\n</body>';
        array_url = [];
        $lang_mark.text(new_text_doc);
        Prism.highlightElement($lang_mark[0]);
    }

    function disposeChart() {
        if (chart) {
            chart.dispose();
            chart = null;
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
                var format = $('.date-pattern').find('td.active').text();

                clearInterval(timerId);
                disposeChart();
                createChart(chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createChart(chart_container, locale, format);
    }

    function askEventLanguageLocale() {
        $('.language-locale').find('td').on('click', function () {
            var $that = $(this);
            var url = $that.attr('data-locale-src');
            var code = $that.attr('data-code');

            loadScript(url, changeLocale, code);
            getDateTimePattern(code);
            activeEl($that);
        }).first().trigger('click');
    }

    function askEventDatePattern() {
        $('.date-pattern').find('td').on('click', function () {
            var $that = $(this);

            activeEl($that);
            changeDatePattern($that.text());
        });
    }

    function createChart(container, locale, format) {
        var date_format = 'EEEE, dd MMMM yyyy';

        if (format) {
            date_format = format;
        }
        // Set a localization for output.
        anychart.format.outputLocale(locale);

        // create data set on our data
        var dataSet = anychart.data.set([
            ['2015/9/01', 10],
            ['2015/9/02', 12],
            ['2015/9/03', 11],
            ['2015/9/04', 15],
            ['2015/9/05', 20],
            ['2015/9/06', 22],
            ['2015/9/07', 21],
            ['2015/9/08', 25],
            ['2015/9/09', 31],
            ['2015/9/10', 32],
            ['2015/9/11', 28],
            ['2015/9/12', 29],
            ['2015/9/13', 40],
            ['2015/9/14', 41],
            ['2015/9/15', 45],
            ['2015/9/16', 50],
            ['2015/9/17', 65],
            ['2015/9/18', 45],
            ['2015/9/19', 50],
            ['2015/9/20', 51],
            ['2015/9/21', 65],
            ['2015/9/22', 60],
            ['2015/9/23', 62],
            ['2015/9/24', 65],
            ['2015/9/25', 45],
            ['2015/9/26', 55],
            ['2015/9/27', 59],
            ['2015/9/28', 52],
            ['2015/9/29', 53],
            ['2015/9/30', 40]
        ]);

        // map data for the first series, take x from the zero column and value from the first column of data set
        var seriesData = dataSet.mapAs({x: [0], value: [1]});

        // create line chart
        chart = anychart.area();
        chart.padding().top('20px');
        // adding dollar symbols to yAxis labels
        chart.yAxis().labels().textFormatter("${%Value}");
        // axes settings
        chart.xAxis().labels().padding([5, 5, 0, 5]);
        chart.xAxis().labels().rotation(90);
        chart.xAxis().overlapMode("allowOverlap");
        chart.xAxis().labels().textFormatter(function () {
            return anychart.format.dateTime(this.value, date_format, -8 * 60, locale);
        });
        chart.tooltip().titleFormatter(function () {
            return anychart.format.dateTime(this.points[0].x, 'dd/MM/yyyy', -8 * 60, locale);
        });

        // create a series with mapped data
        var series = chart.area(seriesData);
        series.name("ACME Share Price");
        series.hoverMarkers().enabled(true).type('circle').size(4);

        // set chart tooltip and interactivity settings
        chart.tooltip().position('top').anchor('centerbottom');
        chart.tooltip().positionMode('point');
        chart.interactivity().hoverMode('byX');
        // set container id for the chart
        chart.container(container);
        // initiate chart drawing
        chart.draw();
    }

    anychart.onDocumentReady(function () {
        // event
        $('.tabs-control a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        getLocaleText();
    });

    $(window).on('load', function () {
        placeBlocks();
        hidePreloader();
    });

    $(window).on('resize', function () {
        placeBlocks();
    });

    function placeBlocks() {
        var mq = window.matchMedia('(max-width: 768px)');

        if (mq.matches) {
            $('.preview-container').detach().insertAfter('.tables-container');
        } else {
            $('.tables-container').detach().insertAfter('.preview-container');
        }
    }
})();
