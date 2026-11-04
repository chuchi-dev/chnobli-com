<script>
	import { onMount } from 'svelte';
	import { animate, timeline, stagger } from 'chnobli';
	import { scroll } from 'chnobli/scroll';
	import { fromTo, curve, pageOffset, responsive } from 'chnobli/utils';
	import { cubicOut, cubicBezier } from 'chnobli/easing';
	import { timeout } from 'chuchi-utils';
	import logoSvg from '@/icons/logo.svg?raw';

	let introEl, h1El, dotContEl, dotEl, somethingElseEl;

	function fadeCharsIn() {
		const chars = h1El.querySelectorAll('svg > *');

		// fade from top
		animate(chars, {
			y: fromTo(-30, 0),
			opacity: 1,
			duration: 300,
			ease: cubicOut,
			delay: stagger(i => 200 + i * 50),
		});
	}

	// the dot jumps over the letters and lands on the i, a oneshot
	// animation, so resizes are ignored
	function jumpingBall() {
		const svg = h1El.querySelector('svg');

		const dotSize = dotEl.offsetWidth;

		const above = el => {
			const offset = pageOffset(el);
			return { x: offset.left, y: offset.top - dotSize };
		};
		const hPos = above(svg.querySelector('.h'));
		const bPos = above(svg.querySelector('.b'));
		const lPos = above(svg.querySelector('.l'));
		const iOffset = pageOffset(svg.querySelector('.i-dot'));
		const iPos = { x: iOffset.left, y: iOffset.top };

		// a jump from a to b, height above a
		const jump = (a, b, height) =>
			curve([a, { x: a.x + (b.x - a.x) / 2, y: a.y - height }, b], 1.2);

		return timeline({ responsive: false })
			.set(dotEl, { x: hPos.x, y: -100 })
			.add(
				dotEl,
				{
					...hPos,
					ease: cubicBezier(0.81, 0.13, 0.85, 0.82),
					duration: 450,
				},
				500,
			)
			.add(dotEl, {
				xy: jump(hPos, bPos, 140),
				ease: cubicBezier(0, 0.2, 1, 0.8),
				duration: 550,
			})
			.add(dotEl, {
				xy: jump(bPos, lPos, 80),
				ease: cubicBezier(0, 0.2, 1, 0.8),
				duration: 500,
			})
			.add(dotEl, {
				xy: jump(lPos, iPos, 30),
				ease: cubicBezier(0, 0.2, 1, 0.8),
				width: iOffset.width,
				height: iOffset.height,
				duration: 550,
			});
	}

	// while scrolling down the dot flies down and grows until it fills the
	// screen, recalculated on resize
	function scrollingDot() {
		let dotPos, center, end, diameter;
		const sizes = responsive(() => {
			const offset = pageOffset(h1El.querySelector('svg .i-dot'));
			dotPos = {
				x: offset.left,
				y: offset.top,
				width: offset.width,
				height: offset.height,
			};
			center = { x: window.innerWidth / 2, y: window.innerHeight };
			end = { x: window.innerWidth * 0.5, y: window.innerHeight * 1.5 };

			const minDiameter = Math.max(window.innerWidth, window.innerHeight);
			diameter = Math.sqrt(2 * Math.pow(minDiameter, 2));
		});

		const dotTimeline = timeline()
			.set(dotEl, {
				width: responsive(() => dotPos.width),
				height: responsive(() => dotPos.height),
			})
			.add(
				dotEl,
				{
					xy: responsive(() =>
						curve([
							dotPos,
							{
								x: dotPos.x + window.innerWidth * 0.05,
								y: dotPos.y + (center.y - dotPos.y) / 2,
							},
							end,
						]),
					),
					duration: 1000,
				},
				0,
			)
			.add(
				dotEl,
				{ scale: responsive(() => diameter / dotPos.width) },
				500,
			)
			.addResponsive(sizes);
		dotTimeline.seek(0);

		scroll()
			.add(introEl)
			.add({ target: somethingElseEl, offset: 'top', view: 'top' })
			.addTimeline(dotTimeline);
	}

	onMount(async () => {
		if (import.meta.env.DEV) await timeout(200);

		dotContEl.style.height = document.body.offsetHeight + 'px';

		fadeCharsIn();
		const intro = jumpingBall();

		if (window.scrollY === 0) {
			const onEnd = intro.onPromise('end');
			intro.play();
			await onEnd;
		} else {
			intro.seek(1);
		}

		scrollingDot();
	});
</script>

<svelte:head>
	<title>Chnobli</title>
</svelte:head>

<div class="scroll-dot-cont" bind:this={dotContEl}>
	<span class="scroll-dot" bind:this={dotEl}></span>
</div>

<div class="intro" bind:this={introEl}>
	<div class="center">
		<h1 bind:this={h1El}>
			<span>Chnobli</span>
			{@html logoSvg}
		</h1>
		<p>Give your website some spice</p>
	</div>
</div>

<div class="something-else" bind:this={somethingElseEl}>
	<div class="center">
		<h1>Get Started</h1>
		<div class="btns">
			<a href="https://github.com/soerenmeier/chnobli" target="_blank">
				on GitHub
			</a>
		</div>
	</div>
</div>

<style lang="scss">
	:global {
		body {
			background-color: var(--gray-500);
		}
	}
	.scroll-dot-cont {
		position: absolute;
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
		// overflow-x: hidden;
		// overflow-y: visible;
	}

	.scroll-dot {
		position: absolute;
		display: block;
		top: 0;
		left: 0;
		width: 1.9vmin;
		height: 1.9vmin;
		background-color: var(--accent-500);
		// background-color: red;
		border-radius: 100%;
		transform: translateY(-100px);
	}

	.intro {
		display: flex;
		height: 100vh;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle, #161900 0%, var(--gray-500) 100%);
		text-align: center;
	}

	h1 {
		position: relative;
		font-size: 12vmin;
		font-weight: 700;

		span {
			position: absolute;
			display: block;
			color: transparent;
			text-align: center;
			width: 100%;

			&::selection {
				color: var(--gray-500);
				background-color: var(--accent-500);
			}
		}

		:global {
			svg {
				width: 46vmin;
				overflow: visible;

				> * {
					opacity: 0;
				}

				.i-dot {
					opacity: 0;
				}

				path {
					fill: var(--accent-500);
				}
			}
		}
	}

	.intro p {
		color: #fff;
		font-size: 1.2rem;
	}

	.something-else {
		position: relative;
		display: flex;
		height: 100vh;
		align-items: center;
		justify-content: center;
		background: transparent;
		color: var(--gray-500);

		.btns {
			margin-top: 2rem;
			text-align: center;
		}

		a {
			display: inline;
			text-decoration: none;
			font-size: 1.3rem;
			font-weight: bold;
			background-color: var(--gray-500);
			color: var(--accent-500);
			padding: 0.5rem 1rem;
			border-radius: 4px;
			border: 3px solid var(--gray-500);

			transition:
				background-color 0.2s ease,
				color 0.2s ease;

			&:hover {
				background-color: var(--accent-500);
				color: var(--gray-500);
			}
		}
	}
</style>
