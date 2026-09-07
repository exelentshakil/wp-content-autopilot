<?php
/**
 * Plugin Name: WP Content Autopilot Bridge
 * Plugin URI: https://github.com/exelentshakil/wp-content-autopilot
 * Description: Seamless REST API bridge for WP Content Autopilot: enables direct REST updates for Header and Footer Scripts (_inpost_head_script / synth_header_script), guarantees Schema.org FAQ JSON-LD output in <head>, provides site-wide interactive FAQ accordion toggles, and auto-clears WP Rocket cache on REST publishing.
 * Version: 1.0.0
 * Author: Atoyan Law Firm / Exelent Shakil
 * Author URI: https://www.atoyanlaw.com
 * License: GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class WP_Content_Autopilot_Bridge {

    /**
     * Singleton instance
     */
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( $this, 'register_rest_meta' ) );
        add_action( 'rest_after_insert_page', array( $this, 'handle_rest_page_update' ), 10, 3 );
        add_action( 'rest_after_insert_post', array( $this, 'handle_rest_page_update' ), 10, 3 );
        add_action( 'wp_head', array( $this, 'render_head_script_fallback' ), 99 );
        add_action( 'wp_footer', array( $this, 'render_accordion_script' ), 99 );
        add_action( 'rest_api_init', array( $this, 'register_custom_routes' ) );
    }

    /**
     * 1. Register _inpost_head_script so WordPress core REST API natively permits it.
     */
    public function register_rest_meta() {
        foreach ( array( 'page', 'post' ) as $post_type ) {
            register_post_meta(
                $post_type,
                '_inpost_head_script',
                array(
                    'show_in_rest' => array(
                        'schema' => array(
                            'type'       => 'object',
                            'properties' => array(
                                'synth_header_script' => array(
                                    'type' => 'string',
                                ),
                            ),
                            'additionalProperties' => true,
                        ),
                    ),
                    'single'        => true,
                    'type'          => 'object',
                    'auth_callback' => function() {
                        return current_user_can( 'edit_pages' );
                    },
                )
            );

            // Also register flat key for maximum compatibility
            register_post_meta(
                $post_type,
                '_inpost_head_script_synth_header_script',
                array(
                    'show_in_rest'  => true,
                    'single'        => true,
                    'type'          => 'string',
                    'auth_callback' => function() {
                        return current_user_can( 'edit_pages' );
                    },
                )
            );
        }
    }

    /**
     * 2. Intercept REST page creations/updates to ensure _inpost_head_script is stored
     * as an exact serialized array matching Header and Footer Scripts (shfs).
     */
    public function handle_rest_page_update( $post, $request, $creating ) {
        $post_id = $post->ID;
        $body = $request->get_json_params();
        if ( ! is_array( $body ) ) {
            return;
        }

        $script = null;

        // Check meta._inpost_head_script
        if ( ! empty( $body['meta']['_inpost_head_script'] ) ) {
            $m = $body['meta']['_inpost_head_script'];
            if ( is_array( $m ) && ! empty( $m['synth_header_script'] ) ) {
                $script = $m['synth_header_script'];
            } elseif ( is_string( $m ) ) {
                $script = $m;
            }
        }

        // Check acf._inpost_head_script
        if ( empty( $script ) && ! empty( $body['acf']['_inpost_head_script'] ) ) {
            $a = $body['acf']['_inpost_head_script'];
            if ( is_array( $a ) && ! empty( $a['synth_header_script'] ) ) {
                $script = $a['synth_header_script'];
            } elseif ( is_string( $a ) ) {
                $script = $a;
            }
        }

        // Check direct top-level fields
        if ( empty( $script ) && ! empty( $body['_inpost_head_script'] ) ) {
            $t = $body['_inpost_head_script'];
            if ( is_array( $t ) && ! empty( $t['synth_header_script'] ) ) {
                $script = $t['synth_header_script'];
            } elseif ( is_string( $t ) ) {
                $script = $t;
            }
        }

        if ( empty( $script ) && ! empty( $body['synth_header_script'] ) ) {
            $script = $body['synth_header_script'];
        }

        // If a script was passed, write it in the exact serialized format expected by shfs
        if ( ! empty( $script ) ) {
            $current_meta = get_post_meta( $post_id, '_inpost_head_script', true );
            $data_to_save = is_array( $current_meta ) ? $current_meta : array();
            $data_to_save['synth_header_script'] = $script;

            update_post_meta( $post_id, '_inpost_head_script', $data_to_save );
            update_post_meta( $post_id, '_inpost_head_script_synth_header_script', $script );
        }

        // Auto-purge WP Rocket cache for this page so updates appear instantly
        if ( function_exists( 'rocket_clean_post' ) ) {
            rocket_clean_post( $post_id );
        }
    }

    /**
     * 3. Fallback renderer for <head>: If Header and Footer Scripts plugin is inactive
     * or failed to echo, output the script safely before </head>.
     */
    public function render_head_script_fallback() {
        if ( ! is_singular() ) {
            return;
        }

        $post_id = get_the_ID();
        if ( ! $post_id ) {
            return;
        }

        // Check if shfs already printed it by checking the meta
        $shfs_meta = get_post_meta( $post_id, '_inpost_head_script', true );
        $script = '';

        if ( is_array( $shfs_meta ) && ! empty( $shfs_meta['synth_header_script'] ) ) {
            $script = $shfs_meta['synth_header_script'];
        } elseif ( is_string( $shfs_meta ) && ! empty( $shfs_meta ) ) {
            $script = $shfs_meta;
        } else {
            // Check subkey
            $subkey = get_post_meta( $post_id, '_inpost_head_script_synth_header_script', true );
            if ( ! empty( $subkey ) ) {
                $script = $subkey;
            }
        }

        // If shfs is active, it hooks into wp_head at priority 10.
        // We only echo if shfs did NOT print or is inactive to prevent duplicates.
        global $wp_actions;
        if ( ! empty( $script ) && ! class_exists( 'HeaderAndFooterScripts' ) ) {
            echo "<!-- WP Content Autopilot Head Script -->\n";
            echo $script, "\n";
        }
    }

    /**
     * 4. Site-wide FAQ Accordion Toggle JS:
     * Delegated, zero-dependency, immune to wpautop and WP Rocket lazyloading.
     */
    public function render_accordion_script() {
        ?>
        <script id="wp-content-autopilot-accordion-js">
        (function() {
            function handleAccordionToggle(e) {
                var header = e.target.closest('.ea-header, .sp-ea-single .ea-header a');
                if (!header) return;

                var card = header.closest('.ea-card, .sp-ea-single');
                if (!card) return;

                var body = card.querySelector('.sp-collapse, [id^="ea-collapse"]');
                if (!body) return;

                var link = card.querySelector('.ea-header a, a[role="button"]');
                var icon = card.querySelector('.ea-expand-icon');
                var isExpanded = card.classList.contains('ea-expand') || body.classList.contains('show') || body.style.display === 'block';

                var container = card.closest('.sp-ea-one, .sp-easy-accordion');
                if (container) {
                    var siblings = container.querySelectorAll('.sp-ea-single, .ea-card');
                    siblings.forEach(function(sib) {
                        if (sib !== card) {
                            sib.classList.remove('ea-expand');
                            var sBody = sib.querySelector('.sp-collapse, [id^="ea-collapse"]');
                            if (sBody) {
                                sBody.style.display = 'none';
                                sBody.classList.remove('show');
                                sBody.classList.add('collapsed');
                            }
                            var sLink = sib.querySelector('.ea-header a, a[role="button"]');
                            if (sLink) {
                                sLink.classList.add('collapsed');
                                sLink.setAttribute('aria-expanded', 'false');
                            }
                            var sIcon = sib.querySelector('.ea-expand-icon');
                            if (sIcon) { sIcon.textContent = '+'; }
                        }
                    });
                }

                if (isExpanded) {
                    body.style.display = 'none';
                    body.classList.remove('show');
                    body.classList.add('collapsed');
                    card.classList.remove('ea-expand');
                    if (link) {
                        link.classList.add('collapsed');
                        link.setAttribute('aria-expanded', 'false');
                    }
                    if (icon) { icon.textContent = '+'; }
                } else {
                    body.style.display = 'block';
                    body.classList.add('show');
                    body.classList.remove('collapsed');
                    card.classList.add('ea-expand');
                    if (link) {
                        link.classList.remove('collapsed');
                        link.setAttribute('aria-expanded', 'true');
                    }
                    if (icon) { icon.textContent = '−'; }
                }

                if (e.cancelable && e.type === 'click') {
                    e.preventDefault();
                }
            }

            document.addEventListener('click', handleAccordionToggle, true);
            document.addEventListener('keydown', function(e) {
                if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.ea-header a')) {
                    handleAccordionToggle(e);
                }
            }, true);
        })();
        </script>
        <?php
    }

    /**
     * 5. Custom REST Endpoints for WP Content Autopilot:
     * /wp-json/autopilot/v1/head-script (POST)
     * /wp-json/autopilot/v1/purge-cache (POST)
     */
    public function register_custom_routes() {
        register_rest_route(
            'autopilot/v1',
            '/head-script',
            array(
                'methods'             => 'POST',
                'callback'            => array( $this, 'rest_set_head_script' ),
                'permission_callback' => function() {
                    return current_user_can( 'edit_pages' );
                },
            )
        );

        register_rest_route(
            'autopilot/v1',
            '/purge-cache',
            array(
                'methods'             => 'POST',
                'callback'            => array( $this, 'rest_purge_cache' ),
                'permission_callback' => function() {
                    return current_user_can( 'edit_pages' );
                },
            )
        );
    }

    public function rest_set_head_script( $request ) {
        $params  = $request->get_json_params();
        $post_id = ! empty( $params['post_id'] ) ? intval( $params['post_id'] ) : 0;
        $script  = ! empty( $params['script'] ) ? $params['script'] : '';

        if ( ! $post_id ) {
            return new WP_Error( 'invalid_post_id', 'Valid post_id is required', array( 'status' => 400 ) );
        }

        $data = array( 'synth_header_script' => $script );
        update_post_meta( $post_id, '_inpost_head_script', $data );
        update_post_meta( $post_id, '_inpost_head_script_synth_header_script', $script );

        if ( function_exists( 'rocket_clean_post' ) ) {
            rocket_clean_post( $post_id );
        }

        return rest_ensure_response( array(
            'success' => true,
            'post_id' => $post_id,
            'saved'   => true,
        ) );
    }

    public function rest_purge_cache( $request ) {
        $params  = $request->get_json_params();
        $post_id = ! empty( $params['post_id'] ) ? intval( $params['post_id'] ) : 0;

        $cleared = false;
        if ( function_exists( 'rocket_clean_post' ) && $post_id ) {
            rocket_clean_post( $post_id );
            $cleared = true;
        } elseif ( function_exists( 'rocket_clean_domain' ) ) {
            rocket_clean_domain();
            $cleared = true;
        }

        return rest_ensure_response( array(
            'success' => true,
            'cleared' => $cleared,
        ) );
    }
}

// Initialize the plugin
add_action( 'plugins_loaded', array( 'WP_Content_Autopilot_Bridge', 'get_instance' ) );
