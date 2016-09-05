(function () {
    var chart;
    var range = ['Mon Jun 29 2009 22:25:18', 'Thu Jul 02 2009 22:11:19'];
    // The data that have been used for this sample can be taken from the CDN
    // http://cdn.anychart.com/csv-data/orcl-intraday.js
    var orcl_intraday_data = get_orcl_intraday_data();
    var text_doc = document.documentElement.innerHTML;
    var array_url = [];
    var chart_container = 'intraday-chart';
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
                createDailyChart(orcl_intraday_data, chart_container, code, format);
            }
        }
    }

    function changeDatePattern(format) {
        var locale = anychart.format.outputLocale();

        disposeChart();
        createDailyChart(orcl_intraday_data, chart_container, locale, format);
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

    function createDailyChart(data, container, locale, format) {
        var date_format = 'EEEE, dd MMMM yyyy - hh:mm';

        if (format) {
            date_format = format;
        }
        // Set a localization for output.
        anychart.format.outputLocale(locale);
        // create data table on loaded data
        var dataTable = anychart.data.table();
        dataTable.addData(data);

        // map loaded data
        var closeMapping = dataTable.mapAs({'value': 4});
        var volumeMapping = dataTable.mapAs({'value': 5, 'type': 'average'});

        // create stock chart
        chart = anychart.stock();
        chart.padding().left('70px');
        chart.padding().top('20px');

        // create value plot on the chart
        var valuePlot = chart.plot(0);
        valuePlot.line(closeMapping).name("Close");
        valuePlot.grid().enabled(true);
        valuePlot.minorGrid().enabled(true);
        valuePlot.legend().titleFormatter(function () {
            return anychart.format.dateTime(this.value, date_format, null, locale);
        });
        valuePlot.legend().itemsTextFormatter(function () {
            return anychart.format.number(this.value, locale);
        });
        valuePlot.yAxis().labels().textFormatter(function () {
            return anychart.format.number(this.value, locale);
        });

        // create volume plot on the chart
        var volumePlot = chart.plot(1);
        volumePlot.column(volumeMapping).name("Volume");
        volumePlot.height('30%');
        volumePlot.legend().titleFormatter(function () {
            return anychart.format.dateTime(this.value, date_format, null, locale);
        });
        volumePlot.legend().itemsTextFormatter(function () {
            return anychart.format.number(this.value, locale);
        });
        volumePlot.yAxis().labels().textFormatter(function () {
            return anychart.format.number(this.value, locale);
        });

        chart.tooltip().titleFormatter(function () {
            return anychart.format.dateTime(this.hoveredDate, 'dd/MM/yy - hh:mm', null, locale);
        });

        chart.tooltip().textFormatter(function () {
            return 'Close: ' + anychart.format.number(eval(this.formattedValues[0]), locale) + '\n' +
                'Volume: ' + anychart.format.number(eval(this.formattedValues[1]), locale);
        });

        // create scroller series with mapped data
        chart.scroller().line(closeMapping);

        if (typeof range[0] === 'string' && typeof range[1] === 'string') {
            range[0] = new Date(range[0]).getTime();
            range[1] = new Date(range[1]).getTime();
        }

        // Sets values for selected range.
        chart.selectRange(range[0], range[1]);

        // set container id for the chart
        chart.container(container);

        // initiate chart drawing
        chart.draw();

        chart.listen("selectedrangechange", function (value) {
            range[0] = value.firstSelected;
            range[1] = value.lastSelected;
        });
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
